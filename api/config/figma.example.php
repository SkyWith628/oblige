<?php
// figma.php 설정 예시 파일 — 실제 figma.php로 복사 후 값을 채우세요
// cp api/config/figma.example.php api/config/figma.php
//
// 토큰 발급: Figma → Settings → Security → Personal access tokens
// File ID:  https://www.figma.com/design/【File_ID】/파일이름

return [
    // figd_ 로 시작하는 Personal Access Token (절대 커밋 금지)
    'token'   => 'figd_여기에_토큰을_붙여넣으세요',

    // 연동할 Figma 파일 ID
    'file_id' => '여기에_File_ID',
];
