#![allow(non_snake_case)]

#[cfg(windows)]
use std::ptr;
#[cfg(windows)]
use tokio::sync::watch;
#[cfg(windows)]
use winapi::ctypes::c_void;
#[cfg(windows)]
use winapi::shared::guiddef::GUID;
#[cfg(windows)]
use winapi::shared::minwindef::ULONG;
#[cfg(windows)]
use winapi::shared::winerror::{HRESULT, S_FALSE, S_OK};
#[cfg(windows)]
use winapi::um::combaseapi::{CoCreateInstance, CoInitializeEx, CLSCTX_ALL};
#[cfg(windows)]
use winapi::um::endpointvolume::{
    IAudioEndpointVolume, IAudioEndpointVolumeCallback, IAudioEndpointVolumeCallbackVtbl,
    AUDIO_VOLUME_NOTIFICATION_DATA,
};
#[cfg(windows)]
use winapi::um::mmdeviceapi::{
    eConsole, eRender, IMMDevice, IMMDeviceEnumerator, MMDeviceEnumerator,
};
#[cfg(windows)]
use winapi::um::objbase::COINIT_APARTMENTTHREADED;
#[cfg(windows)]
use winapi::um::unknwnbase::{IUnknown, IUnknownVtbl};
#[cfg(windows)]
use winapi::Interface;

#[cfg(windows)]
use winapi::Class;

#[repr(C)]
#[cfg(windows)]
struct AudioEndpointVolumeCallback {
    vtable: *const IAudioEndpointVolumeCallbackVtbl,
    ref_count: ULONG,
    tx: watch::Sender<Option<f64>>,
}

#[cfg(windows)]
impl AudioEndpointVolumeCallback {
    pub fn new(tx: watch::Sender<Option<f64>>) -> Self {
        AudioEndpointVolumeCallback {
            vtable: &AUDIO_ENDPOINT_VOLUME_CALLBACK_VTBL,
            ref_count: 1,
            tx,
        }
    }
}

#[cfg(windows)]
extern "system" fn QueryInterface(
    _this: *mut IUnknown,
    _riid: *const GUID,
    ppv: *mut *mut c_void,
) -> HRESULT {
    unsafe {
        *ppv = std::ptr::null_mut();
        1 // E_NOINTERFACE
    }
}

#[cfg(windows)]
extern "system" fn AddRef(this: *mut IUnknown) -> ULONG {
    unsafe {
        let callback = this as *mut AudioEndpointVolumeCallback;
        (*callback).ref_count += 1;
        (*callback).ref_count
    }
}

#[cfg(windows)]
extern "system" fn Release(this: *mut IUnknown) -> ULONG {
    unsafe {
        let callback = this as *mut AudioEndpointVolumeCallback;
        (*callback).ref_count -= 1;
        if (*callback).ref_count == 0 {
            let _ = Box::from_raw(this as *mut AudioEndpointVolumeCallback);
            0
        } else {
            (*callback).ref_count
        }
    }
}

#[cfg(windows)]
extern "system" fn OnNotify(
    this: *mut IAudioEndpointVolumeCallback,
    p_notify: *mut AUDIO_VOLUME_NOTIFICATION_DATA,
) -> HRESULT {
    unsafe {
        if let Some(data) = p_notify.as_ref() {
            let callback = &*(this as *mut AudioEndpointVolumeCallback);
            let _ = callback.tx.send(Some(data.fMasterVolume as f64));
        }
        S_OK
    }
}

#[cfg(windows)]
const AUDIO_ENDPOINT_VOLUME_CALLBACK_VTBL: IAudioEndpointVolumeCallbackVtbl =
    IAudioEndpointVolumeCallbackVtbl {
        parent: IUnknownVtbl {
            QueryInterface,
            AddRef,
            Release,
        },
        OnNotify,
    };

#[cfg(windows)]
pub async fn receive_volume_change() -> Option<watch::Receiver<Option<f64>>> {
    unsafe {
        let hr = CoInitializeEx(ptr::null_mut(), COINIT_APARTMENTTHREADED);
        if hr != S_OK && hr != S_FALSE {
            eprintln!("COM initialization failed: 0x{:08x}", hr);
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
            eprintln!("Failed to create device enumerator: 0x{:08x}", hr);
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

        let (tx, rx) = watch::channel(None);
        let callback = Box::new(AudioEndpointVolumeCallback::new(tx));
        let callback_ptr = Box::into_raw(callback);

        let hr = (*endpoint_volume)
            .RegisterControlChangeNotify(callback_ptr as *mut IAudioEndpointVolumeCallback);
        if hr != S_OK {
            eprintln!("Failed to register control change notify: 0x{:08x}", hr);
            return None;
        }

        Some(rx)
    }
}

#[cfg(not(windows))]
pub async fn receive_volume_change() -> Option<tokio::sync::watch::Receiver<Option<f64>>> {
    None
}
