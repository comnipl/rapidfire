import { Project } from "@/App";

export const mockProject: Project = {
    display_name: "バックエンドに接続していません",
    scenes: [
        {
            id: "sample_scene",
            display_name: "サンプルシーン",
            sounds: [
                {
                    id: "test1",
                    display_name: "テストBGM",
                    path: "./",
                    volume: 80,
                    looped: true,
                    variant: "bgm"
                },
                {
                    id: "test2",
                    display_name: "テスト効果音",
                    path: "./",
                    volume: 50,
                    looped: false,
                    variant: "se"
                },
                {
                    id: "test3",
                    display_name: "テストボイス",
                    path: "./",
                    volume: 100,
                    looped: false,
                    variant: "voice"
                }
            ]
        }
    ]
}
