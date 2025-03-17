//
//  SafariWebExtensionHandler.swift
//  Aira2Helper Extension
//
//  Created by wxm on 2/28/25.
//

import SafariServices
import UserNotifications
import os.log
import Foundation
import AppKit

class SafariWebExtensionHandler: NSExtensionContext, NSExtensionRequestHandling {
    
    func beginRequest(with context: NSExtensionContext) {
        let request = context.inputItems.first as? NSExtensionItem
        
        let profile: UUID?
        if #available(iOS 17.0, macOS 14.0, *) {
            profile = request?.userInfo?[SFExtensionProfileKey] as? UUID
        } else {
            profile = request?.userInfo?["profile"] as? UUID
        }
        
        
        // init response
        let response = NSExtensionItem()
        // init Message
        let message: Any?
        if #available(iOS 15.0, macOS 11.0, *) {
            message = request?.userInfo?[SFExtensionMessageKey]
        } else {
            message = request?.userInfo?["message"]
        }
        
        // MARK sendNativeMessage API
        let messageDict = message as? [String: String]
        
        // BUG some bug here
// https://stackoverflow.com/questions/58370550/unusernotificationcenter-notifications-are-not-allowed-for-this-application
        // https://developer.apple.com/forums/thread/764852
        if messageDict?["message"] == "open-notification" {
            var result : Any?
            let center = UNUserNotificationCenter.current()
            center.requestAuthorization(options: [.alert,.sound, .badge,.provisional]) { success, error in
                if success == true {
                    let content = UNMutableNotificationContent()
                    content.title = messageDict?["title"] ?? "no title"
                    content.subtitle = messageDict?["subtitle"] ?? "no subtitle"
                    content.sound = UNNotificationSound.default
                    content.body = messageDict?["body"] ?? "no body"
                    // show this notification one seconds from now
                    let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
                    let request = UNNotificationRequest(
                        identifier: UUID().uuidString, content: content, trigger: trigger)
                    center.add(request) { error in
                        print("ok")
                        result = error
                    }
                } else {
                    print("no")
                }
            }
            if #available(iOS 15.0, macOS 11.0, *) {
                response.userInfo = [ SFExtensionMessageKey: [ "echo": message , "result": result] ]
            } else {
                response.userInfo = [ "message": [ "echo": message, "result": result ] ]
            }
        }
        
        if messageDict?["message"] == "select-file" {
            let filePath = messageDict?["url"] ?? ""
            // activateFileViewerSelecting(_:) This also works, but it doesn't return any value
            let result = NSWorkspace.shared.selectFile(filePath as String?, inFileViewerRootedAtPath: filePath)
            if #available(iOS 15.0, macOS 11.0, *) {
                response.userInfo = [ SFExtensionMessageKey: [ "echo": message , "result": result] ]
            } else {
                response.userInfo = [ "message": [ "echo": message, "result": result ] ]
            }
        }
        
        
        
        if messageDict?["message"] == "select-torrent" {
            NSApplication.shared.setActivationPolicy(.accessory)
            let openPanel = NSOpenPanel()
            openPanel.title = "Choose one .torrent file"
            openPanel.allowedFileTypes = ["torrent","metalink","meta4"] // Restrict file types to .torrent
            openPanel.allowsMultipleSelection = false
            openPanel.canChooseDirectories = false
            openPanel.canChooseFiles = true
            
            
            if openPanel.runModal() == .OK{
                let url = openPanel.url?.absoluteString
                if #available(iOS 15.0, macOS 11.0, *) {
                    response.userInfo = [ SFExtensionMessageKey: [ "echo": message , "result": url,"path":url] ]
                } else {
                    response.userInfo = [ "message": [ "echo": message, "result": url ,"path":url ] ]
                }
            }
            //
            //            var result: Any?
            //            if openPanel.runModal() == .OK {
            //                // result = openPanel.url?.absoluteString
            //                if let url = openPanel.url {
            //                    do {
            //                        let fileData = try Data(contentsOf: url) // 获取文件数据
            //                        let maxSizeInBytes = 10 * 1024 * 1024 // 设置最大文件大小限制（10MB）
            //                        // 检查文件大小
            //                        if fileData.count > maxSizeInBytes {
            //                            result = "error_file_too_large"
            //                        } else {
            //                            let base64String = fileData.base64EncodedString() // 转换为base64字符串
            //                            result = base64String
            //                        }
            //                    } catch {
            //                        result = "error_reading_file"
            //                    }
            //                }
            //            } else {
            //                result = "canceled" // User canceled selection
            //            }
            //            if #available(iOS 15.0, macOS 11.0, *) {
            //                response.userInfo = [ SFExtensionMessageKey: [ "echo": message , "result": result,"pathBase64":result,"path":openPanel.url?.absoluteString] ]
            //            } else {
            //                response.userInfo = [ "message": [ "echo": message, "result": result ,"pathBase64":result,"path":openPanel.url?.absoluteString ] ]
            //            }
        }
        
        if messageDict?["message"] == "read-file" {
            guard let filepath = messageDict?["filepath"] as? String else {
                
                let errorResult = "error_invalid_filepath"
                if #available(iOS 15.0, macOS 11.0, *) {
                    response.userInfo = [SFExtensionMessageKey: ["echo": message, "result": errorResult, "path": nil]]
                } else {
                    response.userInfo = ["message": ["echo": message, "result": errorResult, "path": nil]]
                }
                return
            }
            // createURL
            guard let url = createURL(from: filepath) else {
                let errorResult = "error_invalid_url"
                if #available(iOS 15.0, macOS 11.0, *) {
                    response.userInfo = [SFExtensionMessageKey: ["echo": message, "result": errorResult, "path": filepath]]
                } else {
                    response.userInfo = ["message": ["echo": message, "result": errorResult, "path": filepath]]
                }
                return
            }
            
            var result: String
            var ok: Bool
            do {
                let fileData = try Data(contentsOf: url)
                let maxSizeInBytes = 20 * 1024 * 1024 // 20MB 限制
                if fileData.count > maxSizeInBytes {
                    result = "error_file_too_large"
                } else {
                    result = fileData.base64EncodedString()
                }
                ok = true
                
            } catch {
                switch error {
                case let nsError as NSError where nsError.code == NSFileReadNoSuchFileError:
                    result = "File not found."
                case let nsError as NSError where nsError.code == NSFileReadNoPermissionError:
                    result = "No permission.You need use \"Select File\" button."
                default:
                    result = "reading file: \(error.localizedDescription)"
                }
                ok = false
            }
            
            // 设置响应
            if #available(iOS 15.0, macOS 11.0, *) {
                response.userInfo = [
                    SFExtensionMessageKey: ["echo": message,"result": result,"path": url.absoluteString,"ok":ok ]
                ]
            } else {
                response.userInfo = [
                    "message": ["echo": message,"result": result,"path": url.absoluteString , "ok":ok ]
                ]
            }
        }
        
        // log
        os_log(.default, "Received message from browser.runtime.sendNativeMessage: %@ (profile: %@)", String(describing: message), profile?.uuidString ?? "none")
        
        context.completeRequest(returningItems: [ response ], completionHandler: nil)
    }
    
}


//func openNotification(title:String = "title",subtitle:String = "subtitle",body:String = "body") async{
//    let center = UNUserNotificationCenter.current()
//    
//    do {
//        if try await center.requestAuthorization(options: [.alert, .sound, .badge]) == true {
//            let content = UNMutableNotificationContent()
//            content.title = title//messageDict?["title"] ?? "no title"
//            content.subtitle = subtitle//messageDict?["subtitle"] ?? "no subtitle"
//            content.sound = UNNotificationSound.default
//            content.body = body//messageDict?["body"] ?? "no body"
//            // show this notification one seconds from now
//            let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
//            let request = UNNotificationRequest(
//                identifier: UUID().uuidString, content: content, trigger: trigger)
//            try await UNUserNotificationCenter.current().add(request)
//        } else {
//            print("fail")
//        }
//        
//    } catch {
//        print("Error")
//    }
//    
//}


//func createURL(from string: String) -> URL? {
//    // If the string is empty, return nil directly.
//    guard !string.isEmpty else {
//        print("none string,unable create URL")
//        return nil
//    }
//
//    // Attempt to parse string as URL
//    if let url = URL(string: string) {
//        // Check if it's a file URL or a valid URL.
//        if url.isFileURL || FileManager.default.fileExists(atPath: url.path) {
//            return url
//        }
//    }
//
//    // If the URL is not valid, assume it's a local file path and add the `file://` prefix.
//    let filePath = string.hasPrefix("/") ? string : "/" + string
//    if let fileURL = URL(string: "file://" + filePath) {
//
//        if FileManager.default.fileExists(atPath: fileURL.path) {
//            return fileURL
//        } else {
//            print("file not exist: \(fileURL.path)")
//            return nil
//        }
//    }
//
//    print("Invalid URL: \(string)")
//    return nil
//}


func createURL(from string: String) -> URL? {
    // 如果字符串为空，直接返回 nil
    guard !string.isEmpty else {
        print("empty string, unable to create URL")
        return nil
    }
    
    // 去掉首尾的空白字符
    let trimmedString = string.trimmingCharacters(in: .whitespaces)
    
    // 如果已经是有效的 URL
    if let url = URL(string: trimmedString) {
        if url.isFileURL {
            // 如果已经是 file:// 格式且文件存在
            if FileManager.default.fileExists(atPath: url.path) {
                return url
            }
            // 如果是 file:// 格式但文件不存在
            print("file does not exist: \(url.path)")
            return nil
        }
    }
    
    // 处理各种路径格式
    var path = trimmedString
    
    // 移除开头的 file:// 前缀（如果有的话）
    if path.hasPrefix("file://") {
        path = String(path.dropFirst(7))
    }
    
    // 处理 ~ 开头的路径
    if path.hasPrefix("~") {
        path = (path as NSString).expandingTildeInPath
    }
    
    // 如果不是绝对路径（不以 / 开头），转换为绝对路径
    if !path.hasPrefix("/") {
        // 获取当前工作目录
        let currentDir = FileManager.default.currentDirectoryPath
        path = (currentDir as NSString).appendingPathComponent(path)
    }
    
    // 规范化路径（处理 .. 和 .）
    let normalizedPath = (path as NSString).standardizingPath
    
    // 创建 file:// URL
    let fileURL = URL(fileURLWithPath: normalizedPath)
    
    // 检查文件是否存在
    if FileManager.default.fileExists(atPath: fileURL.path) {
        return fileURL
    } else {
        print("file does not exist: \(fileURL.path)")
        return nil
    }
}
