import { createStaticStyles } from 'antd-style';

export const styles = createStaticStyles(({ css }) => ({
  chrome: css`
    user-select: none;
  `,
  deleteLine: css`
    margin: 0;
    padding: 4px 10px;
    background: color-mix(in srgb, #f14c4c 16%, transparent);
    color: #c72e2e;
    text-decoration: line-through;
    text-decoration-color: color-mix(in srgb, #c72e2e 50%, transparent);
    box-shadow: inset 3px 0 0 #f14c4c;
  `,
  hunkActions: css`
    position: fixed;
    z-index: 1000;
    display: flex;
    gap: 6px;
    align-items: center;
    padding: 4px;
    border: 1px solid color-mix(in srgb, #000 10%, transparent);
    border-radius: 8px;
    background: color-mix(in srgb, #f4f4f4 92%, transparent);
    box-shadow: 0 2px 10px rgb(0 0 0 / 12%);
    backdrop-filter: blur(10px);
    font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
  `,
  keepBtn: css`
    cursor: pointer;
    padding: 5px 12px;
    border: none;
    border-radius: 6px;
    background: #2ea043;
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    white-space: nowrap;

    &:hover {
      background: #3fb950;
    }
  `,
  navBtn: css`
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: #555;
    font-size: 10px;
    line-height: 1;

    &:hover {
      background: rgb(0 0 0 / 6%);
    }

    &:disabled {
      cursor: default;
      opacity: 0.35;
    }
  `,
  navCount: css`
    min-width: 3.2em;
    color: #555;
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    text-align: center;
    white-space: nowrap;
    user-select: none;
  `,
  topBar: css`
    display: flex;
    gap: 8px;
    align-items: center;
    margin-block-end: 8px;
    padding: 6px 8px;
    border: 1px solid color-mix(in srgb, #000 8%, transparent);
    border-radius: 8px;
    background: color-mix(in srgb, #f7f7f7 96%, transparent);
    font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
  `,
  topSpacer: css`
    flex: 1;
  `,
  undoBtn: css`
    cursor: pointer;
    padding: 5px 10px;
    border: 1px solid color-mix(in srgb, #000 12%, transparent);
    border-radius: 6px;
    background: #ebebeb;
    color: #333;
    font-size: 12px;
    font-weight: 500;
    line-height: 1.2;
    white-space: nowrap;

    &:hover {
      background: #e0e0e0;
    }
  `,
}));

/** Theme on DiffHunk ElementNode DOM — Cursor-like red/green wash. */
export const diffHunkTheme = createStaticStyles(
  ({ css }) => css`
    position: relative;
    margin-block: 2px;
    border-radius: 0;

    &.is-delete {
      background: color-mix(in srgb, #f14c4c 16%, transparent);
      color: #c72e2e;
      text-decoration: line-through;
      text-decoration-color: color-mix(in srgb, #c72e2e 45%, transparent);
    }

    &.is-insert {
      background: color-mix(in srgb, #3fb950 16%, transparent);

      &.is-active {
        background: color-mix(in srgb, #3fb950 22%, transparent);
        box-shadow: inset 3px 0 0 #3fb950;
      }
    }

    &.is-update {
      background: transparent;

      & > :not([data-diff-chrome-kind]) {
        background: color-mix(in srgb, #3fb950 16%, transparent);
      }

      &.is-active > :not([data-diff-chrome-kind]) {
        background: color-mix(in srgb, #3fb950 22%, transparent);
        box-shadow: inset 3px 0 0 #3fb950;
      }
    }

    &.is-delete.is-active {
      background: color-mix(in srgb, #f14c4c 22%, transparent);
      box-shadow: inset 3px 0 0 #f14c4c;
    }
  `,
);
