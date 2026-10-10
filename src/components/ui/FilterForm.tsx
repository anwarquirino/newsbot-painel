import Link from 'next/link';
import type { ReactNode } from 'react';

interface FilterFormProps {
  action: string;
  children: ReactNode;
}

/** Barra de filtros como formulário GET: funciona sem JavaScript e mantém a URL compartilhável. */
export function FilterForm({ action, children }: FilterFormProps) {
  return (
    <form
      method="get"
      action={action}
      className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-line bg-surface p-4"
    >
      {children}
      <div className="flex gap-2">
        <button type="submit" className="btn-primary">
          Filtrar
        </button>
        <Link href={action} className="btn-secondary">
          Limpar
        </Link>
      </div>
    </form>
  );
}

interface TextFieldProps {
  name: string;
  label: string;
  value?: string;
  placeholder?: string;
  type?: 'text' | 'search' | 'date';
  className?: string;
}

export function TextField({
  name,
  label,
  value,
  placeholder,
  type = 'text',
  className = 'w-full md:w-64',
}: TextFieldProps) {
  const id = `filter-${name}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        defaultValue={value ?? ''}
        placeholder={placeholder}
        className="input"
      />
    </div>
  );
}

interface SelectFieldProps {
  name: string;
  label: string;
  value?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  className?: string;
}

export function SelectField({
  name,
  label,
  value,
  options,
  placeholder = 'Todas',
  className = 'w-full md:w-48',
}: SelectFieldProps) {
  const id = `filter-${name}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <select id={id} name={name} defaultValue={value ?? ''} className="input">
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function toOptions(values: string[]): Array<{ value: string; label: string }> {
  return values.map((value) => ({ value, label: value }));
}
