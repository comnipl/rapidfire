use std::io::Error;

#[cfg(not(windows))]
pub fn get_volume() -> Option<f32> {
    None
}

#[cfg(windows)]
pub fn print_message(msg: &str) -> Result<i32, Error> {
    use std::ffi::OsStr;
    use std::iter::once;
    use std::os::windows::ffi::OsStrExt;
    use std::ptr::null_mut;
    use winapi::um::winuser::{MessageBoxW, MB_OK};
    let wide: Vec<u16> = OsStr::new(msg).encode_wide().chain(once(0)).collect();
    let ret = unsafe { MessageBoxW(null_mut(), wide.as_ptr(), wide.as_ptr(), MB_OK) };
    if ret == 0 {
        Err(Error::last_os_error())
    } else {
        Ok(ret)
    }
}
#[cfg(not(windows))]
pub fn print_message(msg: &str) -> Result<(), Error> {
    println!("{}", msg);
    Ok(())
}

#[cfg(windows)]
pub fn get_volume() -> Option<f32> {
    use std::mem::MaybeUninit;
    use std::ptr;

    use winapi::ctypes::c_void;
    use winapi::shared::guiddef::GUID;
    use winapi::shared::winerror::{S_FALSE, S_OK};
    use winapi::um::combaseapi::{CoCreateInstance, CoInitializeEx, CLSCTX_ALL};
    use winapi::um::endpointvolume::IAudioEndpointVolume;
    use winapi::um::mmdeviceapi::{
        eConsole, eRender, IMMDevice, IMMDeviceEnumerator, MMDeviceEnumerator,
    };
    use winapi::um::objbase::COINIT_APARTMENTTHREADED;
    use winapi::Class;
    use winapi::Interface;
    let mut current_volume: f32 = 0.0;
    unsafe {
        let hr = CoInitializeEx(ptr::null_mut(), COINIT_APARTMENTTHREADED);
        if hr != S_OK && hr != S_FALSE {
            let error = format!("COM initialization failed: 0x{:08x}", hr);
            print_message(&error).unwrap();
            return None;
        }

        let mut device_enumerator: *mut IMMDeviceEnumerator = ptr::null_mut();
        let hr = CoCreateInstance(
            &MMDeviceEnumerator::uuidof(),
            ptr::null_mut(),
            CLSCTX_ALL,
            &IMMDeviceEnumerator::uuidof(),
            &mut device_enumerator as *mut _ as *mut *mut c_void,
        );
        if hr != S_OK {
            let error = format!("Failed to create device enumerator: 0x{:08x}", hr);
            print_message(&error).unwrap();
            return None;
        }

        let mut default_device: *mut IMMDevice = ptr::null_mut();
        (*device_enumerator).GetDefaultAudioEndpoint(eRender, eConsole, &mut default_device);

        let mut endpoint_volume: *mut IAudioEndpointVolume = ptr::null_mut();
        (*default_device).Activate(
            &IAudioEndpointVolume::uuidof(),
            CLSCTX_ALL,
            ptr::null_mut(),
            &mut endpoint_volume as *mut _ as *mut *mut c_void,
        );

        (*endpoint_volume).GetMasterVolumeLevelScalar(&mut current_volume);
    }
    Some(current_volume)
}
