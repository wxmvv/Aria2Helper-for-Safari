//
//  SafariWebExtensionHandler.swift
//  Shared (Extension)
//
//  Created by wxm on 3/20/25.
//

import SafariServices
import os.log
import UserNotifications
import Foundation

#if os(iOS)
import UIKit
typealias PlatformViewController = UIViewController
#elseif os(macOS)
import AppKit
import Cocoa
import SafariServices
typealias PlatformViewController = NSViewController
#endif



//class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
//
//    func beginRequest(with context: NSExtensionContext) {
//        let request = context.inputItems.first as? NSExtensionItem
//
//        let profile: UUID?
//        if #available(iOS 17.0, macOS 14.0, *) {
//            profile = request?.userInfo?[SFExtensionProfileKey] as? UUID
//        } else {
//            profile = request?.userInfo?["profile"] as? UUID
//        }
//
//        let message: Any?
//        if #available(iOS 15.0, macOS 11.0, *) {
//            message = request?.userInfo?[SFExtensionMessageKey]
//        } else {
//            message = request?.userInfo?["message"]
//        }
//
//        os_log(.default, "Received message from browser.runtime.sendNativeMessage: %@ (profile: %@)", String(describing: message), profile?.uuidString ?? "none")
//
//        let response = NSExtensionItem()
//        if #available(iOS 15.0, macOS 11.0, *) {
//            response.userInfo = [ SFExtensionMessageKey: [ "echo": message ] ]
//        } else {
//            response.userInfo = [ "message": [ "echo": message ] ]
//        }
//
//        context.completeRequest(returningItems: [ response ], completionHandler: nil)
//    }
//
//}


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
        
        // sendNativeMessage API
        let messageDict = message as? [String: String]
        
        // BUG some bug here notification
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
#if os(macOS)
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
        }
        
        if messageDict?["message"] == "get-color" {
            let accentColor = NSColor.controlAccentColor
            let highlightColor = NSColor.controlAccentColor
            let hrgb = highlightColor.usingColorSpace(.sRGB)
            let r = NSColorToRGBA(rgbColor: hrgb!)
            
            if #available(iOS 15.0, macOS 11.0, *) {
                response.userInfo = [ SFExtensionMessageKey: [ "echo": message , "result": ["r":r.r , "g":r.g , "b":r.b , "a":r.a]] ]
            } else {
                response.userInfo = [ "message": [ "echo": message, "result": ["r":r.r , "g":r.g , "b":r.b , "a":r.a] ] ]
            }
        }
#endif
        
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
//                    result = fileData.base64EncodedString()
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


func createURL(from string: String) -> URL? {
    // If the string is empty, return nil.
    guard !string.isEmpty else {
        print("empty string, unable to create URL")
        return nil
    }
    
    // Remove leading and trailing whitespace.
    let trimmedString = string.trimmingCharacters(in: .whitespaces)
    
    // If the URL is already valid.
    if let url = URL(string: trimmedString) {
        if url.isFileURL {
            // If the file is already existing and the file exists.
            if FileManager.default.fileExists(atPath: url.path) {
                return url
            }
            // If the file is in the format file:// but the file doesn’t exist.
            print("file does not exist: \(url.path)")
            return nil
        }
    }
    
    // Handle various path formats
    var path = trimmedString
    
    // Remove the leading file:// prefix.
    if path.hasPrefix("file://") {
        path = String(path.dropFirst(7))
    }
    
    // Path starting with '~'
    if path.hasPrefix("~") {
        path = (path as NSString).expandingTildeInPath
    }
    
    // If it’s not a guaranteed path (doesn’t start with /), convert it to a guaranteed path.
    if !path.hasPrefix("/") {
        // Get the current working directory
        let currentDir = FileManager.default.currentDirectoryPath
        path = (currentDir as NSString).appendingPathComponent(path)
    }
    
    // Normalization path (handling .. and .)
    let normalizedPath = (path as NSString).standardizingPath
    
    // create file:// URL
    let fileURL = URL(fileURLWithPath: normalizedPath)
    
    // Check if a file exists.
    if FileManager.default.fileExists(atPath: fileURL.path) {
        return fileURL
    } else {
        print("file does not exist: \(fileURL.path)")
        return nil
    }
}

#if os(macOS)
func NSColorToRGBA(rgbColor: NSColor) -> (r: Int, g: Int, b: Int, a: Int) {
    
    // 提取RGB分量
    let red = rgbColor.redComponent
    let green = rgbColor.greenComponent
    let blue = rgbColor.blueComponent
    let alpha = rgbColor.alphaComponent
    
    // 转换为0-255范围
    let red255 = Int(red * 255)
    let green255 = Int(green * 255)
    let blue255 = Int(blue * 255)
    let alpha255 = Int(alpha * 255)
    
    return (red255, green255, blue255, alpha255)
}

#endif
