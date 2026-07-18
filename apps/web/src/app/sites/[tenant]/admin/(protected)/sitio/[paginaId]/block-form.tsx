'use client';

import { useState } from 'react';
import type { FieldDef, ListFieldDef, TipoBloque } from './block-registry';
import { getBlockTypeDef } from './block-registry';

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
      <textarea
        rows={3}
        value={stringValue}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
      />
    );
  }

  if (field.type === 'select') {
    return (
      <select
        value={stringValue}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      >
        <option value="">—</option>
        {field.options?.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === 'number') {
    return (
      <input
        type="number"
        value={stringValue}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
      />
    );
  }

  return (
    // Los campos "url" aceptan tanto links absolutos (externos) como rutas
    // relativas ("/cursos", link interno del propio sitio) — un
    // <input type="url"> exige formato absoluto vía validación nativa del
    // browser y rechazaría el segundo caso, que es real (default-blocks.ts
    // usa "/cursos" como linkBoton por defecto).
    <input
      type="text"
      value={stringValue}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
    />
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
      <label className="text-sm font-medium">{listField.label}</label>
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="space-y-2 rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
          >
            {listField.itemFields.map((field) => (
              <div key={field.key} className="space-y-1">
                <label className="text-xs text-zinc-500">{field.label}</label>
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
              className="text-xs text-red-600 hover:underline dark:text-red-400"
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={agregarItem}
        className="rounded-md border border-zinc-300 px-3 py-1 text-xs transition hover:border-zinc-500 dark:border-zinc-700"
      >
        Agregar {listField.label.toLowerCase()}
      </button>
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
      className="space-y-3 rounded-md bg-zinc-50 p-4 dark:bg-zinc-900"
    >
      {def.fields.map((field) => (
        <div key={field.key} className="space-y-1.5">
          <label className="text-sm font-medium">{field.label}</label>
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
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
        >
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm transition hover:border-zinc-500 dark:border-zinc-700"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
