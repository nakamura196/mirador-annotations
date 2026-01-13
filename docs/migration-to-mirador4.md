# mirador-annotations を Mirador 4.x へ移行した記録

## 背景

mirador-annotations は、IIIF ビューア [Mirador](https://projectmirador.org/) にアノテーション機能を追加するプラグインです。

従来のプロジェクトは以下の構成でした：

- **ビルドツール**: nwb (Create React App ベース)
- **UI ライブラリ**: Material-UI v4
- **Mirador**: 3.x
- **React**: 17.x

しかし、以下の問題が発生していました：

1. **nwb のメンテナンス停止** - nwb は長期間更新されておらず、依存関係の競合が頻発
2. **npm install の失敗** - 古い依存関係により、新しい環境でのセットアップが困難に
3. **セキュリティ脆弱性** - 古いパッケージに多数の脆弱性警告

これらの問題を解決するため、以下への移行を決定しました：

- **ビルドツール**: Vite
- **UI ライブラリ**: MUI v7
- **Mirador**: 4.x
- **React**: 18.x

## 移行作業の概要

### 1. ビルドツールの移行 (nwb → Vite)

nwb の設定ファイルを削除し、`vite.config.js` を新規作成しました。

主なポイント：

```javascript
// vite.config.js
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // draft-js が global を参照するため
    define: {
      global: 'globalThis',
    },

    // 重複パッケージの解決
    resolve: {
      dedupe: [
        '@emotion/react',
        '@emotion/styled',
        'react',
        'react-dom',
      ],
    },
  };
});
```

### 2. Material-UI の移行 (v4 → v7)

- `@material-ui/*` を `@mui/*` に変更
- `makeStyles` を `sx` prop に置き換え
- Grid コンポーネントの API 変更に対応 (`item` と `xs` props が `size` に統合)

```javascript
// 変更前 (MUI v4)
<Grid item xs={12}>

// 変更後 (MUI v7)
<Grid size={12}>
```

### 3. Mirador 4.x への対応

Mirador 4.x では、アクションやセレクターのインポート方法が変更されました：

```javascript
// 変更前 (Mirador 3.x)
import { actions, selectors } from 'mirador';
actions.receiveAnnotation(...)
selectors.getVisibleCanvases(...)

// 変更後 (Mirador 4.x)
import { receiveAnnotation, getVisibleCanvases } from 'mirador';
receiveAnnotation(...)
getVisibleCanvases(...)
```

## ハマったポイント

### 1. `menuItemRef.current.focus is not a function` エラー

#### 症状

アノテーションが存在するキャンバスに移動すると、以下のエラーが発生：

```
TypeError: menuItemRef.current.focus is not a function
```

#### 原因

Mirador 4.x の `CanvasAnnotations` コンポーネントは、`<MenuList autoFocusItem>` を使用しています。この `autoFocusItem` は、リスト内の最初のアイテムに自動的にフォーカスを当てる機能ですが、フォーカス対象の要素が `focus()` メソッドを持っている必要があります。

問題は `CanvasListItem` コンポーネントにありました：

```javascript
// 問題のあるコード
class CanvasListItem extends Component {
  render() {
    return (
      <div> {/* div が ref を受け取るが、focus() メソッドがない */}
        {this.props.children}
      </div>
    );
  }
}
```

MUI の `MenuItem` は内部的に ref を使ってフォーカス制御を行いますが、`CanvasListItem` がクラスコンポーネントで `<div>` をラップしていたため、ref が正しくフォワードされず、`focus()` メソッドが見つからないエラーが発生していました。

#### 解決策

`CanvasListItem` を関数コンポーネントに書き換え、`forwardRef` を使用して ref を `<li>` 要素に直接フォワードするようにしました：

```javascript
import React, { useState, useContext, forwardRef } from 'react';

const CanvasListItem = forwardRef(({
  annotationid, children, ...otherProps
}, ref) => {
  const [isHovering, setIsHovering] = useState(false);
  // ...

  return (
    <li
      ref={ref}  // ref を li 要素に直接フォワード
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...otherProps}
    >
      {/* ... */}
      {children}
    </li>
  );
});
```

#### 学び

- MUI v5+ の `MenuList` の `autoFocusItem` は、子コンポーネントが適切に ref をフォワードすることを期待している
- カスタムリストアイテムコンポーネントを作成する際は、`forwardRef` を使用して ref を DOM 要素に渡す必要がある
- クラスコンポーネントから関数コンポーネントへの移行時は、ref の扱いに注意が必要

---

### 2. CompanionWindow が表示されない

#### 症状

「Create new annotation」ボタンをクリックしても、何も表示されない。コンソールを確認すると：

- `addCompanionWindow` アクションは正常にディスパッチされている
- `AnnotationCreation` コンポーネントの `render()` は呼ばれている
- しかし画面には何も表示されない

また、以下の警告が出ていました：

```
Warning: Failed prop type: The prop `direction` is marked as required
in `CompanionWindow`, but its value is `undefined`.
```

#### 原因

Mirador は `CompanionWindow` コンポーネントを2種類エクスポートしています：

1. **`CompanionWindow`** - ベースコンポーネント（props を手動で渡す必要あり）
2. **`ConnectedCompanionWindow`** - Redux 接続版（props が自動的にストアから取得される）

移行前のコードでは `CompanionWindow` を直接使用していましたが、Mirador 4.x では `ConnectedCompanionWindow` を使用する必要がありました。

```javascript
// 問題のあるコード
import { CompanionWindow } from 'mirador';

// CompanionWindow は direction, position などの props を
// 手動で渡す必要があるが、それらは Redux ストアにある
```

#### 解決策

`ConnectedCompanionWindow` をインポートするように変更：

```javascript
// 修正後
import { ConnectedCompanionWindow as CompanionWindow } from 'mirador';
```

これにより、`direction`、`position` などの必要な props が Redux ストアから自動的に取得されるようになりました。

#### 学び

- Mirador のコンポーネントには、ベース版と Redux 接続版が存在する場合がある
- プラグイン開発時は、どちらのバージョンを使用すべきか確認が必要
- 「コンポーネントは render されているのに表示されない」場合は、必須 props が不足している可能性を疑う

---

## その他の対応事項

### draft-js の global 参照エラー

draft-js は `global` オブジェクトを参照しますが、ブラウザ環境では存在しません。Vite の設定で対応：

```javascript
define: {
  global: 'globalThis',
}
```

### @emotion/react の重複警告

Mirador と本プラグインの両方が @emotion/react をバンドルすることで発生。`resolve.dedupe` で解決：

```javascript
resolve: {
  dedupe: ['@emotion/react', '@emotion/styled', 'react', 'react-dom'],
}
```

### legacy-peer-deps の必要性

`@psychobolt/react-paperjs` が React 17 を peer dependency として要求するため、`.npmrc` に `legacy-peer-deps=true` が引き続き必要。

---

## まとめ

今回の移行で最も時間がかかったのは、以下の2点でした：

1. **ref フォワーディングの問題** - MUI の内部動作を理解し、適切に ref を扱う必要があった
2. **Connected コンポーネントの使用** - Mirador のエクスポート構造を理解する必要があった

どちらも、ライブラリの内部実装を理解することで解決できました。移行作業では、エラーメッセージだけでなく、ライブラリのソースコードを確認することが重要です。

## 参考リンク

- [Mirador](https://projectmirador.org/)
- [MUI Migration Guide](https://mui.com/material-ui/migration/migration-v4/)
- [Vite](https://vitejs.dev/)
- [React forwardRef](https://react.dev/reference/react/forwardRef)
