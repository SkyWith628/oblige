<?php
// OBLIGE — Figma REST API 연동 엔드포인트
//
//   GET /api/figma/figma.php?action=test     연결 테스트 (파일명·마지막 수정일 반환)
//   GET /api/figma/figma.php?action=tokens   파일의 색상 스타일을 디자인 토큰으로 추출
//   GET /api/figma/figma.php?action=file     파일 전체 트리(원본 JSON) 반환
//
require_once __DIR__ . '/../config/helpers.php';

$cfgPath = __DIR__ . '/../config/figma.php';
if (!file_exists($cfgPath)) {
    error('Figma 설정이 없습니다. api/config/figma.example.php 를 figma.php 로 복사하고 토큰을 입력하세요.', 500);
}
$cfg = require $cfgPath;

if (empty($cfg['token']) || str_starts_with($cfg['token'], 'figd_여기에')
    || empty($cfg['file_id']) || $cfg['file_id'] === '여기에_File_ID') {
    error('figma.php 에 token 과 file_id 를 실제 값으로 채워주세요.', 500);
}

// ── Figma API GET 헬퍼 ─────────────────────────────────────
function figma_get(string $path, string $token): array {
    $ch = curl_init("https://api.figma.com/v1{$path}");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => ["X-Figma-Token: {$token}"],
        CURLOPT_TIMEOUT        => 20,
    ]);
    $res  = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err  = curl_error($ch);
    curl_close($ch);

    if ($res === false) error("Figma 연결 실패: {$err}", 502);
    return [$code, json_decode($res, true)];
}

// ── 라우팅 ────────────────────────────────────────────────
$action  = $_GET['action'] ?? 'test';
$fileId  = $cfg['file_id'];
$token   = $cfg['token'];

switch ($action) {

    case 'test': {
        [$code, $data] = figma_get("/files/{$fileId}?depth=1", $token);
        if ($code !== 200) {
            error('Figma 인증/파일 오류: ' . ($data['err'] ?? "HTTP {$code}"), $code);
        }
        respond([
            'connected'    => true,
            'file_name'    => $data['name']          ?? null,
            'last_modified'=> $data['lastModified']   ?? null,
            'version'      => $data['version']        ?? null,
        ]);
    }

    case 'tokens': {
        // 파일의 published color 스타일을 토큰으로 변환
        [$code, $data] = figma_get("/files/{$fileId}", $token);
        if ($code !== 200) error("HTTP {$code}", $code);

        $tokens = [];
        // styles 메타 + 노드 fill 매칭
        $walk = function ($node) use (&$walk, &$tokens) {
            if (isset($node['styles']['fill'], $node['fills'][0]['color'])) {
                $c = $node['fills'][0]['color'];
                $hex = sprintf('#%02X%02X%02X',
                    round($c['r'] * 255), round($c['g'] * 255), round($c['b'] * 255));
                $tokens[$node['name']] = $hex;
            }
            foreach ($node['children'] ?? [] as $child) $walk($child);
        };
        $walk($data['document'] ?? []);

        respond(['tokens' => $tokens, 'count' => count($tokens)]);
    }

    case 'file': {
        [$code, $data] = figma_get("/files/{$fileId}", $token);
        respond($data, $code);
    }

    default:
        error("알 수 없는 action: {$action}", 400);
}
