import { MessageContext } from '@/contexts/MessageContext';
import {
  useCallback,
  useContext,
  useId,
  useMemo,
  useState
} from 'react';

import type { IFormField, IInteractiveFormElement } from 'client-types/';
import { useAuth, useChatInteract } from '@chainlit/react-client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { cn } from '@/lib/utils';

interface InteractiveFormElementProps {
  element: IInteractiveFormElement;
}

const DEFAULT_PROPS = {
  title: '',
  promptMessage: '',
  fields: [] as IFormField[],
  showExtraMessage: true
};

const SUBMITTED_STORAGE_KEY_PREFIX = 'interactive-form-submitted';

function getSubmittedStorageKey(forId: string, elementId: string): string {
  return `${SUBMITTED_STORAGE_KEY_PREFIX}-${forId}-${elementId}`;
}

function getPersistedSubmitted(forId: string, elementId: string): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  try {
    return sessionStorage.getItem(getSubmittedStorageKey(forId, elementId)) === 'true';
  } catch {
    return false;
  }
}

function setPersistedSubmitted(forId: string, elementId: string): void {
  try {
    sessionStorage.setItem(getSubmittedStorageKey(forId, elementId), 'true');
  } catch {
    /* ignore */
  }
}

function getInitialValues(fields: IFormField[]): Record<string, string | number | boolean> {
  const initial: Record<string, string | number | boolean> = {};
  for (const f of fields) {
    if (f.value !== undefined) {
      initial[f.id] = f.value;
    } else if (f.type === 'checkbox') {
      initial[f.id] = false;
    } else if (f.type === 'number') {
      initial[f.id] = '';
    } else {
      initial[f.id] = '';
    }
  }
  return initial;
}

function isRequiredFieldEmpty(
  field: IFormField,
  value: string | number | boolean | undefined
): boolean {
  if (!field.required) return false;
  if (value === undefined) return true;
  if (field.type === 'checkbox') return value !== true;
  if (field.type === 'number') return value === '';
  return String(value).trim() === '';
}

function getValidationErrors(
  fields: IFormField[],
  values: Record<string, string | number | boolean>
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    if (!field.required) continue;
    const value = values[field.id];
    if (isRequiredFieldEmpty(field, value)) {
      errors[field.id] = `${field.label} is required`;
    }
  }
  return errors;
}

function FormFieldRender({
  idPrefix,
  field,
  value,
  onChange,
  error
}: {
  idPrefix: string;
  field: IFormField;
  value: string | number | boolean;
  onChange: (v: string | number | boolean) => void;
  error?: string;
}) {
  const fieldId = `${idPrefix}-${field.id}`;
  const errorClass = error ? 'border-destructive focus-visible:ring-destructive' : '';
  if (field.type === 'textarea') {
    return (
      <Textarea
        id={fieldId}
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.label}
        className={cn('min-h-[56px] text-sm py-1.5 px-2', errorClass)}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : undefined}
      />
    );
  }
  if (field.type === 'number') {
    return (
      <Input
        id={fieldId}
        type="number"
        value={value === '' ? '' : Number(value)}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === '' ? '' : Number(v));
        }}
        placeholder={field.label}
        className={cn('h-8 text-sm', errorClass)}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : undefined}
      />
    );
  }
  if (field.type === 'select') {
    const options = field.options ?? [];
    return (
      <Select
        value={String(value)}
        onValueChange={(v) => onChange(v)}
      >
        <SelectTrigger
          id={fieldId}
          className={cn('h-8 text-sm', errorClass)}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : undefined}
        >
          <SelectValue placeholder={field.label} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt: string) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  if (field.type === 'checkbox') {
    return (
      <div className="flex items-center gap-1.5">
        <Checkbox
          id={fieldId}
          checked={Boolean(value)}
          onCheckedChange={(checked) => onChange(checked === true)}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          className={error ? 'border-destructive data-[state=checked]:bg-destructive' : ''}
        />
        <Label
          htmlFor={fieldId}
          className="font-normal cursor-pointer text-sm"
        >
          {field.label}
        </Label>
      </div>
    );
  }
  if (field.type === 'radio') {
    const options = field.options ?? [];
    return (
      <div
        className="flex flex-col gap-1"
        role="radiogroup"
        aria-label={field.label}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : undefined}
      >
        {options.map((opt: string) => (
          <label key={opt} className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input
              type="radio"
              name={fieldId}
              value={opt}
              checked={value === opt}
              onChange={() => onChange(opt)}
              className="h-4 w-4"
            />
            <span>{opt}</span>
          </label>
        ))}
      </div>
    );
  }
  return (
    <Input
      id={fieldId}
      type="text"
      value={String(value)}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.label}
      className={cn('h-8 text-sm', errorClass)}
      aria-invalid={!!error}
      aria-describedby={error ? `${fieldId}-error` : undefined}
    />
  );
}

export function InteractiveFormElement({ element }: InteractiveFormElementProps) {
  const formInstanceId = useId();
  const { askUser } = useContext(MessageContext);
  const { sendMessage } = useChatInteract();
  const { user } = useAuth();

  const props = useMemo(
    () => ({ ...DEFAULT_PROPS, ...element.props }),
    [element.props]
  );
  const { title, promptMessage, fields, showExtraMessage } = props;

  const [values, setValues] = useState<Record<string, string | number | boolean>>(
    () => getInitialValues(fields)
  );
  const [extraMessage, setExtraMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(() =>
    getPersistedSubmitted(element.forId, element.id)
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const isAskFlow = useMemo(
    () =>
      askUser?.spec.type === 'element' &&
      askUser.spec.step_id === element.forId,
    [askUser, element.forId]
  );

  const updateValue = useCallback((id: string, v: string | number | boolean) => {
    setValues((prev) => ({ ...prev, [id]: v }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const handleSubmit = useCallback(() => {
    if (submitting || submitted) return;

    const errors = getValidationErrors(fields, values);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);

    const payload = {
      ...values,
      extraMessage: showExtraMessage ? extraMessage : undefined,
      submitted: true
    };

    if (isAskFlow && askUser) {
      askUser.callback(payload);
    } else {
      const parts: string[] = [];
      for (const [k, v] of Object.entries(values)) {
        const field = fields.find((f: IFormField) => f.id === k);
        const label = field?.label ?? k;
        parts.push(`${label}: ${String(v)}`);
      }
      if (showExtraMessage && extraMessage.trim()) {
        parts.push('');
        parts.push(extraMessage.trim());
      }
      const message = parts.join('\n') || JSON.stringify(values);
      sendMessage({
        threadId: '',
        id: crypto.randomUUID(),
        name: user?.identifier ?? 'User',
        type: 'user_message',
        output: message,
        createdAt: new Date().toISOString(),
        metadata: { formData: values, extraMessage: showExtraMessage ? extraMessage : undefined }
      });
    }

    setPersistedSubmitted(element.forId, element.id);
    setSubmitted(true);
    setSubmitting(false);
  }, [
    values,
    extraMessage,
    showExtraMessage,
    isAskFlow,
    askUser,
    fields,
    sendMessage,
    user?.identifier,
    submitting,
    submitted,
    element.forId,
    element.id
  ]);

  const handleCancel = useCallback(() => {
    if (isAskFlow && askUser) {
      askUser.callback({ submitted: false });
    }
  }, [isAskFlow, askUser]);

  if (!fields.length) {
    return null;
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-muted/30 p-2.5 flex flex-col gap-2',
        element.display === 'inline' && 'inline-form w-full max-w-xl'
      )}
    >
      {title ? (
        <h3 className="text-xs font-semibold leading-tight">{title}</h3>
      ) : null}
      {promptMessage ? (
        <p className="text-xs text-muted-foreground">{promptMessage}</p>
      ) : null}

      <div className="flex flex-col gap-2">
        {fields.map((field: IFormField) => (
          <div key={field.id} className="flex flex-col gap-1">
            {field.type !== 'checkbox' && field.type !== 'radio' ? (
              <Label
                htmlFor={`${formInstanceId}-${field.id}`}
                className="text-xs"
              >
                {field.label}
                {field.required ? <span className="text-destructive"> *</span> : null}
              </Label>
            ) : null}
            <FormFieldRender
              idPrefix={formInstanceId}
              field={field}
              value={values[field.id] ?? (field.value ?? (field.type === 'checkbox' ? false : ''))}
              onChange={(v) => updateValue(field.id, v)}
              error={fieldErrors[field.id]}
            />
            {fieldErrors[field.id] ? (
              <p
                id={`${formInstanceId}-${field.id}-error`}
                className="text-xs text-destructive"
                role="alert"
              >
                {fieldErrors[field.id]}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      {showExtraMessage ? (
        <div className="flex flex-col gap-1">
          <Label
            htmlFor={`${formInstanceId}-interactive-form-extra`}
            className="text-xs"
          >
            Your message (optional)
          </Label>
          <Textarea
            id={`${formInstanceId}-interactive-form-extra`}
            placeholder="Add any message to send with your choices..."
            value={extraMessage}
            onChange={(e) => setExtraMessage(e.target.value)}
            className="min-h-[48px] text-sm py-1.5 px-2"
          />
        </div>
      ) : null}

      <div className="flex gap-1.5 pt-1.5">
        <Button
          type="button"
          size="sm"
          onClick={handleSubmit}
          disabled={submitting || submitted}
          aria-disabled={submitting || submitted}
        >
          Send
        </Button>
        {isAskFlow ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleCancel}
          >
            Cancel
          </Button>
        ) : null}
      </div>
    </div>
  );
}
