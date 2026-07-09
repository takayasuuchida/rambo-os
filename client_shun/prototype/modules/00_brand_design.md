# RAMBO OS — Brand & Design System

## ブランドコンセプト
**「漆黒の高級車ショールームに置かれた、紅白アヴェンタドール」**

しゅんの愛車（ランボルギーニ・アヴェンタドール紅白）と、群馬の夜の車屋という世界観を、
そのままダッシュボードUIに転写する。
ラグジュアリーかつ男気がある。冷たい未来感ではなく、温度のあるラグジュアリー。

## カラーパレット
| 用途 | カラー | HEX |
|---|---|---|
| Primary (Action / Brand) | Crimson | `#DC143C` |
| Accent (Luxury) | Gold | `#D4AF37` |
| Background | Onyx | `#0a0a0a` / `#050505` |
| Surface | Dark Glass | `rgba(18,18,18,0.7)` + blur |
| Success | Emerald | `#10b981` |
| Text | Off-white | `#f5f5f5` |

## タイポグラフィ
- **Display**: Bebas Neue（KPI数値、見出し）
- **Brand**: Orbitron（モジュール名、ロゴ、ステータス）
- **Body**: Noto Sans JP（本文すべて）

## デザイン原則
1. **Glassmorphism + Glow**: ガラス質の半透明パネル + 紅のグロー（高級車のヘッドライト感）
2. **Diagonal Stripe / Carbon**: 微細な斜線とカーボンファイバー質感で「乗り物」感
3. **Marquee Ticker**: 上部に常時LIVEティッカーで「動いてる感」
4. **Scan Line**: 微妙な水平ラインで「ディスプレイ感」
5. **Sharp Geometry**: 角を立てすぎず、丸角6-16pxで現代的に
6. **動きは最小限**: hover で transform & glow のみ。派手なアニメは入れない（プロ感）

## レイアウト
- **左固定サイドバー（256px）**: モジュール切替 + APIキーステータス
- **トップステータスバー**: LIVEドット + 流れるティッカー + 現在時刻
- **メインキャンバス**: max-w-1400px、p-8、スクロールはここだけ
- **モバイル対応は今回スコープ外**（プロトタイプは1440px以上想定）

## UI コンポーネントの正体（自作）
- `<BrandLogo>`: 回転45度のCrimson菱形 + Goldの R 文字
- `<Sidebar>`: 縦並びナビ、active時に左にCrimsonバー + glow
- `<StatusBar>`: マーキーティッカー
- `<Field>`: 統一フォームフィールド（label + input）
- `<Stat>`: 小型統計表示

## アイコン
全 22 種をインライン SVG で内包（Material Icons / Lucide 系のパス使用）。
外部アイコン CDN への依存ゼロ。

## アクセシビリティ
- フォーカス時 box-shadow で視認性確保
- aria-hidden をアイコンSVGに付与
- 色だけで情報伝達せず、テキストラベルとアイコン併用
