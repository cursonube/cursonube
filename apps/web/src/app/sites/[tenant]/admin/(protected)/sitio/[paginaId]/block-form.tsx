'use client';

import { useState } from 'react';
import type { FieldDef, ListFieldDef, TipoBloque } from './block-registry';
import { getBlockTypeDef } from './block-registry';
import { TextField } from '@/components/ui/text-field';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (value: string | number) => void;
}) {
  const stringValue = value == null ? '' : String(value);

  if (field.type === 'textarea') {
    return (
      <Textarea rows={3} value={stringValue} onChange={(e) => onChange(e.target.value)} />
    );
  }

  if (field.type === 'select') {
    return (
      <Select value={stringValue} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        {field.options?.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </Select>
    );
  }

  if (field.type === 'number') {
    return (
      <TextField
        type="number"
        value={stringValue}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    );
  }

  return (
    // Los campos "url" aceptan tanto links absolutos (externos) como rutas
    // relativas ("/cursos", link interno del propio sitio) — un
    // <input type="url"> exige formato absoluto vía validación nativa del
    // browser y rechazaría el segundo caso, que es real (default-blocks.ts
    // usa "/cursos" como linkBoton por defecto).
    <TextField type="text" value={stringValue} onChange={(e) => onChange(e.target.value)} />
  );
}

function ListFieldEditor({
  listField,
  items,
  onChange,
}: {
  listField: ListFieldDef;
  items: Record<string, unknown>[];
  // Recibe un updater (prevItems => nextItems), nunca el array ya calculado
  // — si un caller armara el array a partir del `items` prop capturado en
  // su closure, tipeos rápidos (varios onChange en la misma tanda de
  // renders) pisarían cambios entre sí. El updater siempre corre sobre el
  // estado más reciente real vía setState funcional (ver BlockForm).
  onChange: (
    updater: (prevItems: Record<string, unknown>[]) => Record<string, unknown>[],
  ) => void;
}) {
  function actualizarItem(idx: number, key: string, value: string) {
    onChange((prevItems) =>
      prevItems.map((item, i) => (i === idx ? { ...item, [key]: value } : item)),
    );
  }

  function agregarItem() {
    onChange((prevItems) => [...prevItems, {}]);
  }

  function eliminarItem(idx: number) {
    onChange((prevItems) => prevItems.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-1.5">
      <label className="text-[13px] font-[550] text-[var(--p-color-text)]">
        {listField.label}
      </label>
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="space-y-2 rounded-[var(--p-radius-md)] border border-[var(--p-color-border)] p-3"
          >
            {listField.itemFields.map((field) => (
              <div key={field.key} className="space-y-1">
                <label className="text-xs text-[var(--p-color-text-secondary)]">
                  {field.label}
                </label>
                <FieldInput
                  field={field}
                  value={item[field.key]}
                  onChange={(value) => actualizarItem(idx, field.key, String(value))}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => eliminarItem(idx)}
              className="text-xs text-[var(--p-color-critical-secondary)] hover:underline"
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>
      <Button type="button" onClick={agregarItem} className="text-xs">
        Agregar {listField.label.toLowerCase()}
      </Button>
    </div>
  );
}

export function BlockForm({
  tipo,
  initialPropiedades,
  onSubmit,
  onCancel,
  submitLabel = 'Guardar',
}: {
  tipo: TipoBloque;
  initialPropiedades: Record<string, unknown>;
  onSubmit: (propiedades: Record<string, unknown>) => void;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const def = getBlockTypeDef(tipo);
  const [values, setValues] = useState<Record<string, unknown>>(initialPropiedades);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
      className="space-y-3 rounded-[var(--p-radius-md)] bg-[var(--p-color-surface-secondary)] p-4"
    >
      {def.fields.map((field) => (
        <div key={field.key} className="space-y-1.5">
          <label className="text-[13px] font-[550] text-[var(--p-color-text)]">
            {field.label}
          </label>
          <FieldInput
            field={field}
            value={values[field.key]}
            onChange={(value) => setValues((prev) => ({ ...prev, [field.key]: value }))}
          />
        </div>
      ))}

      {def.listFields.map((listField) => (
        <ListFieldEditor
          key={listField.key}
          listField={listField}
          items={(values[listField.key] as Record<string, unknown>[]) ?? []}
          onChange={(updater) =>
            setValues((prev) => ({
              ...prev,
              [listField.key]: updater(
                (prev[listField.key] as Record<string, unknown>[]) ?? [],
              ),
            }))
          }
        />
      ))}

      <div className="flex gap-2 pt-2">
        <Button type="submit" variant="primary">
          {submitLabel}
        </Button>
        <Button type="button" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
