import type { Meta2d } from '@meta2d/core';
import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react';

import { useEditorLocale } from '@/react/hooks/useEditorLocale';

type PenData = Record<string, unknown>;

const panelStyle: CSSProperties = {
  borderLeft: '1px solid #f0f0f0',
  flexShrink: 0,
  maxHeight: '100%',
  overflowX: 'hidden',
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  touchAction: 'pan-y',
  width: 220,
};

const labelStyle: CSSProperties = {
  color: '#8c8c8c',
  fontSize: 12,
  marginBottom: 4,
};

const sectionStyle: CSSProperties = {
  borderBottom: '1px solid #f0f0f0',
  padding: '10px 12px',
};

const rowStyle: CSSProperties = {
  alignItems: 'center',
  display: 'flex',
  gap: 6,
  marginBottom: 6,
};

const inputStyle: CSSProperties = {
  background: '#fafafa',
  border: '1px solid #e5e5e5',
  borderRadius: 4,
  fontSize: 12,
  height: 28,
  outline: 'none',
  padding: '0 6px',
};

const fieldLabel: CSSProperties = {
  color: '#8c8c8c',
  fontSize: 11,
  minWidth: 22,
};

const layerBtn: CSSProperties = {
  background: '#fff',
  border: '1px solid #d9d9d9',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 11,
  minWidth: 48,
  padding: '4px 8px',
};

const TEXT_DEBOUNCE_MS = 120;

export function PenProps({ engine }: { engine: Meta2d | null }) {
  const { t } = useEditorLocale();
  const [pen, setPen] = useState<PenData | null>(null);
  const [rect, setRect] = useState<{ height: number; width: number; x: number; y: number } | null>(
    null,
  );
  /** Local draft so typing stays snappy; canvas updates are debounced. */
  const [textDraft, setTextDraft] = useState('');
  const textTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const penIdRef = useRef<unknown>(null);

  const flushTextToEngine = useCallback(
    (penId: unknown, value: string) => {
      if (!engine || penId === null || penId === undefined) return;
      engine.setValue({ id: penId, text: value } as never, { render: true } as never);
    },
    [engine],
  );

  const selectHandler = useCallback(
    (pens?: PenData[]) => {
      if (!pens || pens.length !== 1) {
        if (textTimerRef.current) {
          clearTimeout(textTimerRef.current);
          textTimerRef.current = null;
        }
        setPen(null);
        setRect(null);
        setTextDraft('');
        penIdRef.current = null;
        return;
      }
      const p = pens[0];
      if (p.globalAlpha === null || p.globalAlpha === undefined) p.globalAlpha = 1;
      // Selection change: sync draft. Same pen active events while typing must not clobber draft.
      if (p.id !== penIdRef.current) {
        if (textTimerRef.current) {
          clearTimeout(textTimerRef.current);
          textTimerRef.current = null;
        }
        penIdRef.current = p.id;
        setTextDraft((p.text as string) ?? '');
      }
      setPen(p);
      if (engine) {
        try {
          setRect(engine.getPenRect(p as never));
        } catch {
          setRect(null);
        }
      }
    },
    [engine],
  );

  const inactiveHandler = useCallback(() => {
    if (textTimerRef.current) {
      clearTimeout(textTimerRef.current);
      textTimerRef.current = null;
    }
    setPen(null);
    setRect(null);
    setTextDraft('');
    penIdRef.current = null;
  }, []);

  useEffect(() => {
    if (!engine) return;
    engine.on('active', selectHandler);
    engine.on('inactive', inactiveHandler);
    return () => {
      engine.off('active', selectHandler);
      engine.off('inactive', inactiveHandler);
      if (textTimerRef.current) {
        clearTimeout(textTimerRef.current);
        textTimerRef.current = null;
      }
    };
  }, [engine, selectHandler, inactiveHandler]);

  if (!pen || !engine) {
    return (
      <aside style={panelStyle}>
        <div style={{ color: '#bbb', fontSize: 12, padding: 16, textAlign: 'center' }}>
          {t('meta2d.props.empty')}
        </div>
      </aside>
    );
  }

  const changeValue = (prop: string, value: unknown) => {
    const v: Record<string, unknown> = { id: pen.id };
    v[prop] = value;
    if (prop === 'dash') {
      const lineDashs = [undefined, [5, 5]];
      v.lineDash = lineDashs[value as number];
    }
    // Keep React panel in sync for non-text props (text uses textDraft).
    if (prop !== 'text') {
      setPen((prev) => (prev ? { ...prev, ...v } : prev));
    }
    engine.setValue(v as never, { render: true } as never);
  };

  const changeText = (value: string) => {
    setTextDraft(value);
    const penId = pen.id;
    if (textTimerRef.current) clearTimeout(textTimerRef.current);
    textTimerRef.current = setTimeout(() => {
      textTimerRef.current = null;
      flushTextToEngine(penId, value);
    }, TEXT_DEBOUNCE_MS);
  };

  const commitText = () => {
    if (textTimerRef.current) {
      clearTimeout(textTimerRef.current);
      textTimerRef.current = null;
    }
    flushTextToEngine(pen.id, textDraft);
  };

  const changeRect = (prop: string, value: number) => {
    if (!rect) return;
    const updated: Record<string, unknown> = { id: pen.id };
    updated[prop] = value;
    engine.setValue(updated as never, { render: true } as never);
    setRect((r) => (r ? { ...r, [prop]: value } : null));
  };

  const changeLayer = (fn: (m: Meta2d) => void) => {
    fn(engine);
    engine.render(true);
  };

  return (
    <aside style={panelStyle}>
      {/* Text */}
      <div style={sectionStyle}>
        <div style={labelStyle}>{t('meta2d.props.text')}</div>
        <div style={rowStyle}>
          <input
            onBlur={commitText}
            onChange={(e) => changeText(e.target.value)}
            onKeyDown={(e) => {
              // Keep Meta2d / host shortcuts from eating typing.
              e.stopPropagation();
              if (e.key === 'Enter') {
                e.preventDefault();
                (e.target as HTMLInputElement).blur();
              }
            }}
            style={{ ...inputStyle, flex: 1, width: '100%' }}
            type="text"
            value={textDraft}
          />
        </div>
      </div>

      {/* Appearance */}
      <div style={sectionStyle}>
        <div style={{ ...labelStyle, marginBottom: 6 }}>{t('meta2d.props.appearance')}</div>

        <div style={rowStyle}>
          <span style={fieldLabel}>{t('meta2d.props.color')}</span>
          <input
            onChange={(e) => changeValue('color', e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
            type="color"
            value={(pen.color as string) || '#1f1f1f'}
          />
        </div>

        <div style={rowStyle}>
          <span style={fieldLabel}>{t('meta2d.props.bg')}</span>
          <input
            onChange={(e) => changeValue('background', e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
            type="color"
            value={(pen.background as string) || '#ffffff'}
          />
        </div>

        <div style={rowStyle}>
          <span style={fieldLabel}>{t('meta2d.props.dash')}</span>
          <select
            onChange={(e) => changeValue('dash', Number(e.target.value))}
            style={{ ...inputStyle, flex: 1 }}
            value={String((pen.dash as number) ?? 0)}
          >
            <option value="0">{t('meta2d.props.solid')}</option>
            <option value="1">{t('meta2d.props.dashLine')}</option>
          </select>
        </div>

        <div style={rowStyle}>
          <span style={fieldLabel}>{t('meta2d.props.radius')}</span>
          <input
            max={1}
            min={0}
            onChange={(e) => changeValue('borderRadius', Number(e.target.value))}
            step={0.01}
            style={{ ...inputStyle, flex: 1 }}
            type="range"
            value={String((pen.borderRadius as number) ?? 0)}
          />
          <span style={{ color: '#8c8c8c', fontSize: 11, width: 32 }}>
            {(pen.borderRadius as number) ?? 0}
          </span>
        </div>

        <div style={rowStyle}>
          <span style={fieldLabel}>{t('meta2d.props.alpha')}</span>
          <input
            max={1}
            min={0}
            onChange={(e) => changeValue('globalAlpha', Number(e.target.value))}
            step={0.01}
            style={{ ...inputStyle, flex: 1 }}
            type="range"
            value={String((pen.globalAlpha as number) ?? 1)}
          />
          <span style={{ color: '#8c8c8c', fontSize: 11, width: 32 }}>
            {((pen.globalAlpha as number) ?? 1).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Position & Size */}
      <div style={sectionStyle}>
        <div style={{ ...labelStyle, marginBottom: 6 }}>{t('meta2d.props.position')}</div>
        {(
          [
            ['X', 'x'],
            ['Y', 'y'],
            ['W', 'width'],
            ['H', 'height'],
          ] as const
        ).map(([label, key]) => (
          <div key={key} style={rowStyle}>
            <span style={fieldLabel}>{label}</span>
            <input
              onChange={(e) => changeRect(key, Number(e.target.value))}
              style={{ ...inputStyle, flex: 1 }}
              type="number"
              value={rect ? rect[key] : 0}
            />
          </div>
        ))}
      </div>

      {/* Text alignment */}
      <div style={sectionStyle}>
        <div style={{ ...labelStyle, marginBottom: 6 }}>{t('meta2d.props.textAlign')}</div>
        <div style={rowStyle}>
          <span style={fieldLabel}>{t('meta2d.props.h')}</span>
          <select
            onChange={(e) => changeValue('textAlign', e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
            value={(pen.textAlign as string) || 'center'}
          >
            <option value="left">{t('meta2d.props.left')}</option>
            <option value="center">{t('meta2d.props.center')}</option>
            <option value="right">{t('meta2d.props.right')}</option>
          </select>
        </div>
        <div style={rowStyle}>
          <span style={fieldLabel}>{t('meta2d.props.v')}</span>
          <select
            onChange={(e) => changeValue('textBaseline', e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
            value={(pen.textBaseline as string) || 'middle'}
          >
            <option value="top">{t('meta2d.props.topAlign')}</option>
            <option value="middle">{t('meta2d.props.middle')}</option>
            <option value="bottom">{t('meta2d.props.bottomAlign')}</option>
          </select>
        </div>
      </div>

      {/* Layer */}
      <div style={sectionStyle}>
        <div style={{ ...labelStyle, marginBottom: 6 }}>{t('meta2d.props.layer')}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          <button onClick={() => changeLayer((m) => m.top())} style={layerBtn} type="button">
            {t('meta2d.props.top')}
          </button>
          <button onClick={() => changeLayer((m) => m.up())} style={layerBtn} type="button">
            {t('meta2d.props.up')}
          </button>
          <button onClick={() => changeLayer((m) => m.down())} style={layerBtn} type="button">
            {t('meta2d.props.down')}
          </button>
          <button onClick={() => changeLayer((m) => m.bottom())} style={layerBtn} type="button">
            {t('meta2d.props.bottom')}
          </button>
        </div>
      </div>
    </aside>
  );
}
