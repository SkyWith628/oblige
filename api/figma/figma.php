<?php
// OBLIGE — Figma REST API 연동 엔드포인트
//
//   GET /api/figma?action=test     연결 테스트 (파일명·마지막 수정일 반환)
//   GET /api/figma?action=tokens   파일의 색상 스타일을 디자인 토큰으로 추출
//   GET /api/figma?action=file     파일 전체 트리(원본 JSON) 반환
//
require_once __DIR__ . '/../config/helpers.php';

// 관리자 전용 엔드포인트
auth_admin();

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

    $data = json_decode($res, true);
    if ($data === null) error('Figma API 응답이 올바른 JSON이 아닙니다.', 502);

    return [$code, $data];
}

// ── 라우팅 ────────────────────────────────────────────────
$action  = $_GET['action'] ?? 'test';
$fileId  = $cfg['file_id'];
$token   = $cfg['token'];

switch ($action) {

    case 'test': {
        [$code, $data] = figma_get("/files/{$fileId}?depth=1", $token);
        if ($code !== 200) {
            error('Figma 인증/파일 오류: ' . ($data['err'] ?? $data['message'] ?? "HTTP {$code}"), $code);
        }
        respond([
            'connected'    => true,
            'file_name'    => $data['name']          ?? null,
            'last_modified'=> $data['lastModified']   ?? null,
            'version'      => $data['version']        ?? null,
        ]);
        break;
    }

    case 'tokens': {
        // /files/:id/styles 로 정의된 color 스타일 목록을 먼저 가져온 뒤
        // 해당 노드들만 /nodes 로 조회해 실제 fill 값을 매칭한다.
        [$code, $styleData] = figma_get("/files/{$fileId}/styles", $token);
        if ($code !== 200) {
            error('Figma 스타일 조회 오류: ' . ($styleData['err'] ?? $styleData['message'] ?? "HTTP {$code}"), $code);
        }

        $colorNodeIds = [];
        $styleNameMap = []; // nodeId → style name
        foreach ($styleData['meta']['styles'] ?? [] as $style) {
            if ($style['style_type'] === 'FILL') {
                $colorNodeIds[]                  = $style['node_id'];
                $styleNameMap[$style['node_id']] = $style['name'];
            }
        }

        if (empty($colorNodeIds)) {
            respond(['tokens' => [], 'count' => 0]);
            break;
        }

        $ids = implode(',', array_map('rawurlencode', $colorNodeIds));
        [$code, $nodeData] = figma_get("/files/{$fileId}/nodes?ids={$ids}", $token);
        if ($code !== 200) {
            error('Figma 노드 조회 오류: ' . ($nodeData['err'] ?? $nodeData['message'] ?? "HTTP {$code}"), $code);
        }

        $tokens = [];
        foreach ($nodeData['nodes'] ?? [] as $nodeId => $wrapper) {
            $node = $wrapper['document'] ?? null;
            if (!$node) continue;
            $fill = $node['fills'][0] ?? null;
            if (!$fill || $fill['type'] !== 'SOLID' || !isset($fill['color'])) continue;
            $c   = $fill['color'];
            $hex = sprintf('#%02X%02X%02X',
                round($c['r'] * 255), round($c['g'] * 255), round($c['b'] * 255));
            $name          = $styleNameMap[$nodeId] ?? ($node['name'] ?? $nodeId);
            $tokens[$name] = $hex;
        }

        respond(['tokens' => $tokens, 'count' => count($tokens)]);
        break;
    }

    case 'file': {
        [$code, $data] = figma_get("/files/{$fileId}", $token);
        if ($code !== 200) {
            error('Figma 파일 조회 오류: ' . ($data['err'] ?? $data['message'] ?? "HTTP {$code}"), $code);
        }
        respond($data);
        break;
    }

    default:
        error("알 수 없는 action: {$action}", 400);
}
