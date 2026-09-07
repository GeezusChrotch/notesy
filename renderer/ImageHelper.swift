import AppKit
import WebKit
import ImageIO

func fail(_ message:String)->Never {fputs(message+"\n",stderr);exit(1)}
let args=CommandLine.arguments
if args.count != 6 {fail("Invalid image conversion request.")}
let input=URL(fileURLWithPath:args[1]),width=Int(args[2]) ?? 0,height=Int(args[3]) ?? 0,kind=args[4],assets=URL(fileURLWithPath:args[5],isDirectory:true)
guard width>=16 && width<=200 && height>=16 && height<=220 else {fail("Invalid watch dimensions.")}
func output(_ data:Data){
 guard let source=CGImageSourceCreateWithData(data as CFData,nil),let properties=CGImageSourceCopyPropertiesAtIndex(source,0,nil) as? [CFString:Any],let w=properties[kCGImagePropertyPixelWidth] as? Int,let h=properties[kCGImagePropertyPixelHeight] as? Int,w>0,h>0,w<=32000000/h else {fail("Unsupported or oversized image.")}
 let options:[CFString:Any]=[kCGImageSourceCreateThumbnailFromImageAlways:true,kCGImageSourceThumbnailMaxPixelSize:max(width,height),kCGImageSourceCreateThumbnailWithTransform:true]
 guard let image=CGImageSourceCreateThumbnailAtIndex(source,0,options as CFDictionary) else {fail("Could not decode image.")}
 let scale=min(Double(width)/Double(image.width),Double(height)/Double(image.height));let iw=max(1,Int(Double(image.width)*scale)),ih=max(1,Int(Double(image.height)*scale))
 var pixels=[UInt8](repeating:255,count:iw*ih*4)
 pixels.withUnsafeMutableBytes { raw in
  guard let context=CGContext(data:raw.baseAddress,width:iw,height:ih,bitsPerComponent:8,bytesPerRow:iw*4,space:CGColorSpaceCreateDeviceRGB(),bitmapInfo:CGImageAlphaInfo.premultipliedLast.rawValue) else {fail("Could not allocate image.")}
  context.setFillColor(CGColor(gray:1,alpha:1));context.fill(CGRect(x:0,y:0,width:iw,height:ih));context.interpolationQuality = .high
  context.draw(image,in:CGRect(x:0,y:0,width:iw,height:ih))
 }
 let result:[String:Any]=["width":iw,"height":ih,"rgba":Data(pixels).base64EncodedString()]
 guard let encoded=try? JSONSerialization.data(withJSONObject:result) else {fail("Could not encode image.")}
 FileHandle.standardOutput.write(encoded);exit(0)
}
guard let data=try? Data(contentsOf:input),data.count<=20*1024*1024 else {fail("Image exceeds the 20 MB limit.")}
if kind == "pdf-info" || kind.hasPrefix("pdf:") {
 guard let provider=CGDataProvider(data:data as CFData),let pdf=CGPDFDocument(provider) else {fail("Invalid PDF.")}
 guard pdf.isUnlocked else {fail("Password-protected PDFs cannot be displayed.")}
 guard pdf.numberOfPages>0 && pdf.numberOfPages<=1000 else {fail("PDF exceeds the 1000-page preview limit.")}
 if kind == "pdf-info" {print("{\"pages\":\(pdf.numberOfPages)}");exit(0)}
 guard let number=Int(kind.dropFirst(4)),number>=1,let page=pdf.page(at:number) else {fail("This PDF page is unavailable.")}
 let box=page.getBoxRect(.cropBox),rotated=abs(page.rotationAngle)%180 == 90
 let pw=rotated ? box.height:box.width,ph=rotated ? box.width:box.height
 guard pw.isFinite && ph.isFinite && pw>0 && ph>0 else {fail("Invalid PDF page dimensions.")}
 let scale=min(Double(width)/pw,Double(height)/ph),iw=max(1,Int(pw*scale)),ih=max(1,Int(ph*scale))
 var pixels=[UInt8](repeating:255,count:iw*ih*4)
 pixels.withUnsafeMutableBytes {raw in
  guard let ctx=CGContext(data:raw.baseAddress,width:iw,height:ih,bitsPerComponent:8,bytesPerRow:iw*4,space:CGColorSpaceCreateDeviceRGB(),bitmapInfo:CGImageAlphaInfo.premultipliedLast.rawValue) else {fail("Could not allocate PDF preview.")}
  let rect=CGRect(x:0,y:0,width:iw,height:ih)
  ctx.setFillColor(CGColor(gray:1,alpha:1));ctx.fill(rect)
  ctx.concatenate(page.getDrawingTransform(.cropBox,rect:rect,rotate:0,preserveAspectRatio:true));ctx.drawPDFPage(page)
 }
 let result:[String:Any]=["width":iw,"height":ih,"rgba":Data(pixels).base64EncodedString()]
 guard let encoded=try? JSONSerialization.data(withJSONObject:result) else {fail("Could not encode PDF preview.")}
 FileHandle.standardOutput.write(encoded);exit(0)
}
if kind=="image" {output(data)}
NSApplication.shared.setActivationPolicy(.prohibited)
final class Renderer:NSObject,WKNavigationDelegate,WKScriptMessageHandler {
 var view:WKWebView!
 var sourceData=Data()
 func userContentController(_ userContentController:WKUserContentController,didReceive message:WKScriptMessage){
  guard let payload=message.body as? [String:Any],let encoded=payload["data"] as? String,let image=Data(base64Encoded:encoded) else {fail("Drawing could not be rendered.")};output(image)
 }
 func webView(_ webView:WKWebView,didFinish navigation:WKNavigation!){
  let code:String
  if kind=="drawing" {
   guard let json=try? JSONSerialization.jsonObject(with:sourceData),let normalized=try? JSONSerialization.data(withJSONObject:json,options:[.fragmentsAllowed]),let value=String(data:normalized,encoding:.utf8) else {fail("Invalid drawing JSON.")}
   code="window.renderDrawing("+value+"); null"
  } else {code="window.renderSVG('"+sourceData.base64EncodedString()+"'); null"}
  webView.evaluateJavaScript(code){_,error in if error != nil {fail("Could not start drawing renderer.")}}
 }
}
let renderer=Renderer(),configuration=WKWebViewConfiguration();renderer.sourceData=data;configuration.websiteDataStore = .nonPersistent()
configuration.userContentController.add(renderer,name:"result")
let rules="[{\"trigger\":{\"url-filter\":\"^https?://\"},\"action\":{\"type\":\"block\"}}]"
WKContentRuleListStore.default().compileContentRuleList(forIdentifier:"notesy-local-media",encodedContentRuleList:rules){rules,error in
 guard let rules=rules,error==nil else {fail("Could not isolate drawing renderer.")};configuration.userContentController.add(rules)
 renderer.view=WKWebView(frame:CGRect(x:0,y:0,width:1200,height:1200),configuration:configuration);renderer.view.navigationDelegate=renderer
 renderer.view.loadFileURL(assets.appendingPathComponent("index.html"),allowingReadAccessTo:assets)
}
DispatchQueue.main.asyncAfter(deadline:.now()+12){fail("Drawing rendering timed out.")}
RunLoop.main.run()
