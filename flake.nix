{
  description = "developing environment of Rust";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { 
          inherit system;
        };
        llvm = pkgs.llvmPackages;
        # See https://discourse.nixos.org/t/develop-shell-environment-setup-for-macos/11399/6
        coreAudio = if pkgs.stdenv.isDarwin then
          pkgs.symlinkJoin {
            name = "sdk";
            paths = with pkgs.darwin.apple_sdk.frameworks; [
              AudioToolbox
              AudioUnit
              CoreAudio
              CoreFoundation
              CoreMIDI
              OpenAL
            ];
            postBuild = ''
              mkdir $out/System
              mv $out/Library $out/System
            '';
          }
        else "";
      in {
        devShells = {
          default = pkgs.mkShell {
            nativeBuildInputs = with pkgs; [
              libiconv
              darwin.apple_sdk.frameworks.Security
              darwin.apple_sdk.frameworks.CoreServices
              darwin.apple_sdk.frameworks.CoreAudio
              darwin.apple_sdk.frameworks.CoreFoundation
              darwin.apple_sdk.frameworks.Foundation
              darwin.apple_sdk.frameworks.AppKit
              darwin.apple_sdk.frameworks.WebKit
              darwin.apple_sdk.frameworks.Cocoa
              darwin.apple_sdk.frameworks.AudioUnit
              darwin.apple_sdk.frameworks.AudioToolbox
              rustPlatform.bindgenHook
              rustup
              libsndfile
              cargo-xwin
            ];
            builtdInputs = [
              coreAudio
            ];
            LIBCLANG_PATH = "${llvm.libclang.lib}/lib";
            COREAUDIO_SDK_PATH = "${coreAudio}";
            shellHook = ''
              exec $SHELL
            '';
          };
        };
      }
    );
}
