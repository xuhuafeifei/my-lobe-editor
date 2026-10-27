import { LexicalDiff } from "@/renderer";
import type { SerializedEditorState } from "lexical";

/** User-provided Lobe playground copy — before vs after small edits */
const oldValue = {
  "root": {
    "children": [
      {
        "children": [
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": "Welcome to the Lobe Editor Demo!",
            "type": "text",
            "version": 1,
            "id": "2"
          }
        ],
        "direction": "ltr",
        "format": "",
        "indent": 0,
        "type": "heading",
        "version": 1,
        "tag": "h1",
        "id": "1"
      },
      {
        "children": [
          {
            "children": [
              {
                "detail": 0,
                "format": 0,
                "mode": "normal",
                "style": "",
                "text": "In case you were wondering what the black box at the bottom is – it's the debug view, showing the current state of the editor. You can disable it by pressing on the settings control in the bottom-left of your screen and toggling the debug view setting.",
                "type": "text",
                "version": 1,
                "id": "5"
              }
            ],
            "direction": "ltr",
            "format": "",
            "indent": 0,
            "type": "paragraph",
            "version": 1,
            "textFormat": 0,
            "textStyle": "",
            "id": "4"
          }
        ],
        "direction": "ltr",
        "format": "",
        "indent": 0,
        "type": "quote",
        "version": 1,
        "id": "3"
      },
      {
        "children": [
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": "The playground is a demo environment built with ",
            "type": "text",
            "version": 1,
            "id": "7"
          },
          {
            "children": [
              {
                "detail": 0,
                "format": 0,
                "mode": "normal",
                "style": "",
                "text": "﻿",
                "type": "cursor",
                "version": 1,
                "id": "9"
              },
              {
                "detail": 0,
                "format": 0,
                "mode": "normal",
                "style": "",
                "text": "﻿",
                "type": "cursor",
                "version": 1,
                "id": "10"
              },
              {
                "detail": 0,
                "format": 0,
                "mode": "normal",
                "style": "",
                "text": "@lobehub/editor",
                "type": "text",
                "version": 1,
                "id": "11"
              }
            ],
            "direction": "ltr",
            "format": "",
            "indent": 0,
            "type": "codeInline",
            "version": 1,
            "id": "8"
          },
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": "﻿",
            "type": "cursor",
            "version": 1,
            "id": "12"
          },
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": ". Try typing in ",
            "type": "text",
            "version": 1,
            "id": "13"
          },
          {
            "detail": 0,
            "format": 1,
            "mode": "normal",
            "style": "",
            "text": "some text",
            "type": "text",
            "version": 1,
            "id": "14"
          },
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": " with ",
            "type": "text",
            "version": 1,
            "id": "15"
          },
          {
            "detail": 0,
            "format": 2,
            "mode": "normal",
            "style": "",
            "text": "different formats",
            "type": "text",
            "version": 1,
            "id": "16"
          },
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": ".",
            "type": "text",
            "version": 1,
            "id": "17"
          }
        ],
        "direction": "ltr",
        "format": "",
        "indent": 0,
        "type": "paragraph",
        "version": 1,
        "textFormat": 0,
        "textStyle": "",
        "id": "6"
      },
      {
        "children": [
          {
            "children": [
              {
                "detail": 0,
                "format": 0,
                "mode": "normal",
                "style": "",
                "text": "Visit the ",
                "type": "text",
                "version": 1,
                "id": "20"
              },
              {
                "detail": 0,
                "format": 0,
                "mode": "normal",
                "style": "",
                "text": "Lobe Editor website",
                "type": "text",
                "version": 1,
                "id": "21"
              },
              {
                "detail": 0,
                "format": 0,
                "mode": "normal",
                "style": "",
                "text": " for documentation and more information.",
                "type": "text",
                "version": 1,
                "id": "22"
              }
            ],
            "direction": "ltr",
            "format": "",
            "indent": 0,
            "type": "listitem",
            "version": 1,
            "value": 1,
            "id": "19"
          },
          {
            "children": [
              {
                "detail": 0,
                "format": 0,
                "mode": "normal",
                "style": "",
                "text": "Check out the code on our ",
                "type": "text",
                "version": 1,
                "id": "24"
              },
              {
                "detail": 0,
                "format": 0,
                "mode": "normal",
                "style": "",
                "text": "GitHub repository",
                "type": "text",
                "version": 1,
                "id": "25"
              },
              {
                "detail": 0,
                "format": 0,
                "mode": "normal",
                "style": "",
                "text": ".",
                "type": "text",
                "version": 1,
                "id": "26"
              }
            ],
            "direction": "ltr",
            "format": "",
            "indent": 0,
            "type": "listitem",
            "version": 1,
            "value": 2,
            "id": "23"
          },
          {
            "children": [
              {
                "detail": 0,
                "format": 0,
                "mode": "normal",
                "style": "",
                "text": "Playground code ",
                "type": "text",
                "version": 1,
                "id": "28"
              },
              {
                "detail": 0,
                "format": 0,
                "mode": "normal",
                "style": "",
                "text": "Playground code",
                "type": "text",
                "version": 1,
                "id": "29"
              },
              {
                "detail": 0,
                "format": 0,
                "mode": "normal",
                "style": "",
                "text": " can be found here.",
                "type": "text",
                "version": 1,
                "id": "30"
              }
            ],
            "direction": "ltr",
            "format": "",
            "indent": 0,
            "type": "listitem",
            "version": 1,
            "value": 3,
            "id": "27"
          },
          {
            "children": [
              {
                "detail": 0,
                "format": 0,
                "mode": "normal",
                "style": "",
                "text": "Join our ",
                "type": "text",
                "version": 1,
                "id": "32"
              },
              {
                "detail": 0,
                "format": 0,
                "mode": "normal",
                "style": "",
                "text": "Discover Server",
                "type": "text",
                "version": 1,
                "id": "33"
              },
              {
                "detail": 0,
                "format": 0,
                "mode": "normal",
                "style": "",
                "text": " and chat with the team.",
                "type": "text",
                "version": 1,
                "id": "34"
              }
            ],
            "direction": "ltr",
            "format": "",
            "indent": 0,
            "type": "listitem",
            "version": 1,
            "value": 4,
            "id": "31"
          }
        ],
        "direction": "ltr",
        "format": "",
        "indent": 0,
        "type": "list",
        "version": 1,
        "listType": "bullet",
        "start": 1,
        "tag": "ul",
        "id": "18"
      },
      {
        "children": [
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": "Lastly, we're constantly adding cool new features to this playground. So make sure you check back here when you next get a chance 🙂.",
            "type": "text",
            "version": 1,
            "id": "36"
          }
        ],
        "direction": "ltr",
        "format": "",
        "indent": 0,
        "type": "paragraph",
        "version": 1,
        "textFormat": 0,
        "textStyle": "",
        "id": "35"
      },
      {
        "children": [
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": "import { Editor } from '@lobehub/editor';",
            "type": "code-highlight",
            "version": 1,
            "id": "38"
          }
        ],
        "direction": "ltr",
        "format": "",
        "indent": 0,
        "type": "code",
        "version": 1,
        "language": "typescript",
        "id": "37"
      }
    ],
    "direction": "ltr",
    "format": "",
    "indent": 0,
    "type": "root",
    "version": 1,
    "id": "root"
  }
} as unknown as SerializedEditorState;

const newValue = {
  "root": {
    "children": [
      {
        "children": [
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": "Welcome to the Lobe Editor Demo!",
            "type": "text",
            "version": 1,
            "id": "40"
          }
        ],
        "direction": "ltr",
        "format": "",
        "indent": 0,
        "type": "heading",
        "version": 1,
        "tag": "h1",
        "id": "39"
      },
      {
        "children": [
          {
            "children": [
              {
                "detail": 0,
                "format": 0,
                "mode": "normal",
                "style": "",
                "text": "In case you were wondering what the black box at the bottom is – it's the debug view, showing the current state of the editor. You can disable it by pressing the settings control in the bottom-left of your screen and toggling the debug view setting.",
                "type": "text",
                "version": 1,
                "id": "43"
              }
            ],
            "direction": "ltr",
            "format": "",
            "indent": 0,
            "type": "paragraph",
            "version": 1,
            "textFormat": 0,
            "textStyle": "",
            "id": "42"
          }
        ],
        "direction": "ltr",
        "format": "",
        "indent": 0,
        "type": "quote",
        "version": 1,
        "id": "41"
      },
      {
        "children": [
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": "The playground is a demo environment built with ",
            "type": "text",
            "version": 1,
            "id": "45"
          },
          {
            "children": [
              {
                "detail": 0,
                "format": 0,
                "mode": "normal",
                "style": "",
                "text": "﻿",
                "type": "cursor",
                "version": 1,
                "id": "47"
              },
              {
                "detail": 0,
                "format": 0,
                "mode": "normal",
                "style": "",
                "text": "﻿",
                "type": "cursor",
                "version": 1,
                "id": "48"
              },
              {
                "detail": 0,
                "format": 0,
                "mode": "normal",
                "style": "",
                "text": "@lobehub/editor",
                "type": "text",
                "version": 1,
                "id": "49"
              }
            ],
            "direction": "ltr",
            "format": "",
            "indent": 0,
            "type": "codeInline",
            "version": 1,
            "id": "46"
          },
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": "﻿",
            "type": "cursor",
            "version": 1,
            "id": "50"
          },
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": ". Try typing in ",
            "type": "text",
            "version": 1,
            "id": "51"
          },
          {
            "detail": 0,
            "format": 1,
            "mode": "normal",
            "style": "",
            "text": "some text",
            "type": "text",
            "version": 1,
            "id": "52"
          },
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": " with ",
            "type": "text",
            "version": 1,
            "id": "53"
          },
          {
            "detail": 0,
            "format": 2,
            "mode": "normal",
            "style": "",
            "text": "different formats",
            "type": "text",
            "version": 1,
            "id": "54"
          },
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": ".",
            "type": "text",
            "version": 1,
            "id": "55"
          }
        ],
        "direction": "ltr",
        "format": "",
        "indent": 0,
        "type": "paragraph",
        "version": 1,
        "textFormat": 0,
        "textStyle": "",
        "id": "44"
      },
      {
        "children": [
          {
            "children": [
              {
                "detail": 0,
                "format": 0,
                "mode": "normal",
                "style": "",
                "text": "Visit the ",
                "type": "text",
                "version": 1,
                "id": "58"
              },
              {
                "detail": 0,
                "format": 0,
                "mode": "normal",
                "style": "",
                "text": "Lobe Editor website",
                "type": "text",
                "version": 1,
                "id": "59"
              },
              {
                "detail": 0,
                "format": 0,
                "mode": "normal",
                "style": "",
                "text": " for documentation and more information.",
                "type": "text",
                "version": 1,
                "id": "60"
              }
            ],
            "direction": "ltr",
            "format": "",
            "indent": 0,
            "type": "listitem",
            "version": 1,
            "value": 1,
            "id": "57"
          },
          {
            "children": [
              {
                "detail": 0,
                "format": 0,
                "mode": "normal",
                "style": "",
                "text": "Check out the code on our ",
                "type": "text",
                "version": 1,
                "id": "62"
              },
              {
                "detail": 0,
                "format": 0,
                "mode": "normal",
                "style": "",
                "text": "GitHub repository",
                "type": "text",
                "version": 1,
                "id": "63"
              },
              {
                "detail": 0,
                "format": 0,
                "mode": "normal",
                "style": "",
                "text": ".",
                "type": "text",
                "version": 1,
                "id": "64"
              }
            ],
            "direction": "ltr",
            "format": "",
            "indent": 0,
            "type": "listitem",
            "version": 1,
            "value": 2,
            "id": "61"
          },
          {
            "children": [
              {
                "detail": 0,
                "format": 0,
                "mode": "normal",
                "style": "",
                "text": "The playground code can be found ",
                "type": "text",
                "version": 1,
                "id": "66"
              },
              {
                "detail": 0,
                "format": 0,
                "mode": "normal",
                "style": "",
                "text": "here",
                "type": "text",
                "version": 1,
                "id": "67"
              },
              {
                "detail": 0,
                "format": 0,
                "mode": "normal",
                "style": "",
                "text": ".",
                "type": "text",
                "version": 1,
                "id": "68"
              }
            ],
            "direction": "ltr",
            "format": "",
            "indent": 0,
            "type": "listitem",
            "version": 1,
            "value": 3,
            "id": "65"
          },
          {
            "children": [
              {
                "detail": 0,
                "format": 0,
                "mode": "normal",
                "style": "",
                "text": "Join our ",
                "type": "text",
                "version": 1,
                "id": "70"
              },
              {
                "detail": 0,
                "format": 0,
                "mode": "normal",
                "style": "",
                "text": "Discord server",
                "type": "text",
                "version": 1,
                "id": "71"
              },
              {
                "detail": 0,
                "format": 0,
                "mode": "normal",
                "style": "",
                "text": " and chat with the team.",
                "type": "text",
                "version": 1,
                "id": "72"
              }
            ],
            "direction": "ltr",
            "format": "",
            "indent": 0,
            "type": "listitem",
            "version": 1,
            "value": 4,
            "id": "69"
          }
        ],
        "direction": "ltr",
        "format": "",
        "indent": 0,
        "type": "list",
        "version": 1,
        "listType": "bullet",
        "start": 1,
        "tag": "ul",
        "id": "56"
      },
      {
        "children": [
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": "Lastly, we're constantly adding cool new features to this playground, so make sure to check back here when you next get a chance 🙂.",
            "type": "text",
            "version": 1,
            "id": "74"
          }
        ],
        "direction": "ltr",
        "format": "",
        "indent": 0,
        "type": "paragraph",
        "version": 1,
        "textFormat": 0,
        "textStyle": "",
        "id": "73"
      },
      {
        "children": [
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": "import { Editor } from '@lobehub/editor';",
            "type": "code-highlight",
            "version": 1,
            "id": "76"
          }
        ],
        "direction": "ltr",
        "format": "",
        "indent": 0,
        "type": "code",
        "version": 1,
        "language": "typescript",
        "id": "75"
      }
    ],
    "direction": "ltr",
    "format": "",
    "indent": 0,
    "type": "root",
    "version": 1,
    "id": "root"
  }
} as unknown as SerializedEditorState;

export default () => {
  return (
    <LexicalDiff
      labels={{ new: "NEW", old: "OLD" }}
      newValue={newValue}
      oldValue={oldValue}
      style={{ fontFamily: "system-ui, sans-serif", lineHeight: 1.8, maxWidth: 1100 }}
    />
  );
};
