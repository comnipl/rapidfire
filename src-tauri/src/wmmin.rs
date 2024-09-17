use windows::Win32::Foundation::HWND;
use windows::Win32::UI::WindowsAndMessaging::{FindWindowA, ShowWindow, SW_MINIMIZE};

 pub fn wmmin() {
    // Windows Media Player ウィンドウを探す
    let Ok(hwnd) = (unsafe { FindWindowA("WMPlayerApp".into(), None) }) else {
        return;
    };

    if hwnd.0 != 0 {
        // ウィンドウを最小化
        unsafe {
            ShowWindow(hwnd, SW_MINIMIZE);
        }
        println!("Windows Media Player window has been minimized.");
    } else {
        println!("Failed to find the Windows Media Player window.");
    }
}