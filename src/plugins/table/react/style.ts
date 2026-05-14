import { createStaticStyles } from 'antd-style';

export const styles = createStaticStyles(
  ({ css, cssVar }) => css`
    overflow-x: auto;
    margin-block: calc(var(--lobe-markdown-margin-multiple) * 0.5em)
      calc(var(--lobe-markdown-margin-multiple) * 0.5em + 16px);
    /* flex 布局下，min-width: auto 会让容器按内容无限撑开，导致 overflow-x: auto 失效
       设置 min-width: 0 是 CSS flex 布局经典 fix，让容器真正被父宽度约束 */
    min-width: 0;

    .editor_table {
      table-layout: fixed;
      border-spacing: 0;
      border-collapse: collapse;

      width: fit-content;

      text-align: start;
      text-indent: initial;
      text-wrap: pretty;
      word-break: auto-phrase;
      overflow-wrap: break-word;

      background: ${cssVar.colorFillQuaternary};

      > tr:first-of-type {
        background: ${cssVar.colorFillQuaternary};

        .editor_table_cell_header {
          font-weight: bold;
        }
      }
    }

    code {
      word-break: break-word;
    }

    .editor_table_cell_header {
      font-weight: normal;
    }

    .editor_table_cell {
      position: relative;

      overflow: auto;

      width: 75px;
      padding-block: 6px;
      padding-inline: 8px;
      border: 1px solid ${cssVar.colorFillSecondary};

      text-align: start;
      vertical-align: top;

      outline: none;
    }

    .editor_table_cell_selected {
      color: #000;
      background-color: ${cssVar.yellow};
      caret-color: transparent;
    }
  `,
);
