import { MessageContext } from '@/contexts/MessageContext';
import {
  useCallback,
  useContext,
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

function FormFieldRender({
  field,
  value,
  onChange
}: {
  field: IFormField;
  value: string | number | boolean;
  onChange: (v: string | number | boolean) => void;
}) {
  if (field.type === 'textarea') {
    return (
      <Textarea
        id={field.id}
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.label}
        className="min-h-[80px]"
      />
    );
  }
  if (field.type === 'number') {
    return (
      <Input
        id={field.id}
        type="number"
        value={value === '' ? '' : Number(value)}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === '' ? '' : Number(v));
        }}
        placeholder={field.label}
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
        <SelectTrigger id={field.id}>
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
      <div className="flex items-center gap-2">
        <Checkbox
          id={field.id}
          checked={Boolean(value)}
          onCheckedChange={(checked) => onChange(checked === true)}
        />
        <Label htmlFor={field.id} className="font-normal cursor-pointer">
          {field.label}
        </Label>
      </div>
    );
  }
  if (field.type === 'radio') {
    const options = field.options ?? [];
    return (
      <div className="flex flex-col gap-2" role="radiogroup" aria-label={field.label}>
        {options.map((opt: string) => (
          <label key={opt} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={field.id}
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
      id={field.id}
      type="text"
      value={String(value)}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.label}
    />
  );
}

export function InteractiveFormElement({ element }: InteractiveFormElementProps) {
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

  const isAskFlow = useMemo(
    () =>
      askUser?.spec.type === 'element' &&
      askUser.spec.step_id === element.forId,
    [askUser, element.forId]
  );

  const updateValue = useCallback((id: string, v: string | number | boolean) => {
    setValues((prev) => ({ ...prev, [id]: v }));
  }, []);

  const handleSubmit = useCallback(() => {
    if (submitting) return;
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
    submitting
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
        'rounded-lg border border-border bg-muted/30 p-4 flex flex-col gap-4',
        element.display === 'inline' && 'inline-form w-full max-w-xl'
      )}
    >
      {title ? (
        <h3 className="text-sm font-semibold leading-tight">{title}</h3>
      ) : null}
      {promptMessage ? (
        <p className="text-sm text-muted-foreground">{promptMessage}</p>
      ) : null}

      <div className="flex flex-col gap-4">
        {fields.map((field: IFormField) => (
          <div key={field.id} className="flex flex-col gap-2">
            {field.type !== 'checkbox' && field.type !== 'radio' ? (
              <Label htmlFor={field.id}>
                {field.label}
                {field.required ? <span className="text-destructive"> *</span> : null}
              </Label>
            ) : null}
            <FormFieldRender
              field={field}
              value={values[field.id] ?? (field.value ?? (field.type === 'checkbox' ? false : ''))}
              onChange={(v) => updateValue(field.id, v)}
            />
          </div>
        ))}
      </div>

      {showExtraMessage ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="interactive-form-extra">Your message (optional)</Label>
          <Textarea
            id="interactive-form-extra"
            placeholder="Add any message to send with your choices..."
            value={extraMessage}
            onChange={(e) => setExtraMessage(e.target.value)}
            className="min-h-[60px]"
          />
        </div>
      ) : null}

      <div className="flex gap-2 pt-2">
        <Button type="button" onClick={handleSubmit} disabled={submitting}>
          Send
        </Button>
        {isAskFlow ? (
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </div>
  );
}
