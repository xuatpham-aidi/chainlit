import { MessageContext } from '@/contexts/MessageContext';
import {
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState
} from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';

import { activeInteractiveFormState } from '@/state/chat';

import type { IFormField, IInteractiveFormElement } from 'client-types/';
import {
  ChainlitContext,
  sessionIdState,
  useAuth,
  useChatInteract
} from '@chainlit/react-client';
import { useTranslation } from '@/components/i18n/Translator';

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
  /** When false, the Send button is disabled (form is not on the latest message). */
  isLatestMessage?: boolean;
}

const DEFAULT_PROPS = {
  title: '',
  promptMessage: '',
  fields: [] as IFormField[],
  showExtraMessage: true
};

const STORAGE_PREFIX = 'interactive-form';

function storageKey(forId: string, elementId: string, suffix: string): string {
  return `${STORAGE_PREFIX}-${suffix}-${forId}-${elementId}`;
}

function getPersistedSubmitted(forId: string, elementId: string): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  try {
    return sessionStorage.getItem(storageKey(forId, elementId, 'submitted')) === 'true';
  } catch {
    return false;
  }
}

function getPersistedFormData(forId: string, elementId: string): {
  values: Record<string, string | number | boolean>;
  extraMessage: string;
  showExtra: boolean;
} | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(storageKey(forId, elementId, 'data'));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistFormState(
  forId: string,
  elementId: string,
  values: Record<string, string | number | boolean>,
  extraMessage: string,
  showExtra: boolean
): void {
  try {
    sessionStorage.setItem(storageKey(forId, elementId, 'submitted'), 'true');
    sessionStorage.setItem(
      storageKey(forId, elementId, 'data'),
      JSON.stringify({ values, extraMessage, showExtra })
    );
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
    } else {
      initial[f.id] = '';
    }
  }
  return initial;
}

function isFieldFilled(
  field: IFormField,
  value: string | number | boolean | undefined
): boolean {
  if (value === undefined) return false;
  if (field.type === 'checkbox') return value === true;
  if (field.type === 'number') return value !== '';
  return String(value).trim() !== '';
}

function hasAnyFieldFilled(
  fields: IFormField[],
  values: Record<string, string | number | boolean>
): boolean {
  return fields.some((f) => isFieldFilled(f, values[f.id]));
}

function FormFieldRender({
  idPrefix,
  field,
  value,
  onChange,
  error,
  disabled
}: {
  idPrefix: string;
  field: IFormField;
  value: string | number | boolean;
  onChange: (v: string | number | boolean) => void;
  error?: string;
  disabled?: boolean;
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
        className={cn(
          'min-h-[56px] text-sm py-1.5 px-2',
          errorClass,
          disabled && 'resize-none'
        )}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        readOnly={disabled}
        disabled={disabled}
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
        readOnly={disabled}
        disabled={disabled}
      />
    );
  }
  if (field.type === 'select') {
    const options = field.options ?? [];
    return (
      <Select
        value={String(value)}
        onValueChange={(v) => onChange(v)}
        disabled={disabled}
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
          disabled={disabled}
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
        className={cn('flex flex-col gap-1')}
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
              disabled={disabled}
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
      readOnly={disabled}
      disabled={disabled}
    />
  );
}

export function InteractiveFormElement({ element, isLatestMessage = true }: InteractiveFormElementProps) {
  const formInstanceId = useId();
  const { t } = useTranslation();
  const setActiveForm = useSetRecoilState(activeInteractiveFormState);
  const { askUser } = useContext(MessageContext);
  const { sendMessage } = useChatInteract();
  const { user } = useAuth();
  const apiClient = useContext(ChainlitContext);
  const sessionId = useRecoilValue(sessionIdState);

  const props = useMemo(
    () => ({ ...DEFAULT_PROPS, ...element.props }),
    [element.props]
  );
  const { title, promptMessage, fields, showExtraMessage } = props;

  // Check DB-persisted state first (survives new tabs/sessions),
  // then fall back to sessionStorage (same-tab persistence).
  const dbSubmitted = element.props?.submitted === true;

  const persisted = useMemo(() => {
    if (dbSubmitted) {
      return {
        values: (element.props?.submittedValues ?? {}) as Record<string, string | number | boolean>,
        extraMessage: (element.props?.submittedExtraMessage ?? '') as string,
        showExtra: (element.props?.submittedShowExtra ?? false) as boolean
      };
    }
    return getPersistedFormData(element.forId, element.id);
  }, [element.forId, element.id, element.props, dbSubmitted]);
  const [values, setValues] = useState<Record<string, string | number | boolean>>(
    () => persisted?.values ?? getInitialValues(fields)
  );
  const [extraMessage, setExtraMessage] = useState(persisted?.extraMessage ?? '');
  const [showExtra, setShowExtra] = useState(persisted?.showExtra ?? false);
  const [submitted, setSubmitted] = useState(() =>
    dbSubmitted || getPersistedSubmitted(element.forId, element.id)
  );

  useEffect(() => {
    const isActive = isLatestMessage && !submitted;
    setActiveForm(isActive);
    return () => setActiveForm(false);
  }, [isLatestMessage, submitted, setActiveForm]);

  const isAskFlow = useMemo(
    () =>
      askUser?.spec.type === 'element' &&
      askUser.spec.step_id === element.forId,
    [askUser, element.forId]
  );

  const updateValue = useCallback((id: string, v: string | number | boolean) => {
    setValues((prev) => ({ ...prev, [id]: v }));
    setShowExtra(false);
  }, []);

  const selectExtraMessage = useCallback(() => {
    setShowExtra(true);
    setValues(() => getInitialValues(fields));
  }, [fields]);

  const anyFilled = useMemo(
    () => hasAnyFieldFilled(fields, values) || (showExtra && extraMessage.trim() !== ''),
    [fields, values, showExtra, extraMessage]
  );

  const canSubmit = isLatestMessage && !submitted && anyFilled;

  const persistToDb = useCallback(
    (
      vals: Record<string, string | number | boolean>,
      extra: string,
      showEx: boolean
    ) => {
      if (!sessionId) return;
      const updatedProps = {
        ...element.props,
        submitted: true,
        submittedValues: vals,
        submittedExtraMessage: extra,
        submittedShowExtra: showEx
      };
      apiClient
        .updateElement({ ...element, props: updatedProps }, sessionId)
        .catch(() => {
          /* best-effort persistence */
        });
    },
    [element, sessionId, apiClient]
  );

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;

    const payload = {
      ...values,
      extraMessage: showExtraMessage ? extraMessage : undefined,
      submitted: true
    };

    if (isAskFlow && askUser) {
      askUser.callback(payload);
    } else {
      const parts: string[] = [];
      for (const [, v] of Object.entries(values)) {
        const str = String(v).trim();
        if (str) parts.push(str);
      }
      if (showExtraMessage && extraMessage.trim()) {
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

    persistFormState(element.forId, element.id, values, extraMessage, showExtra);
    persistToDb(values, extraMessage, showExtra);
    setSubmitted(true);
  }, [
    values,
    extraMessage,
    showExtra,
    showExtraMessage,
    isAskFlow,
    askUser,
    sendMessage,
    user?.identifier,
    canSubmit,
    element.forId,
    element.id,
    persistToDb
  ]);

  const handleCancel = useCallback(() => {
    if (submitted) return;

    if (isAskFlow && askUser) {
      askUser.callback({ submitted: false });
    } else {
      sendMessage({
        threadId: '',
        id: crypto.randomUUID(),
        name: user?.identifier ?? 'User',
        type: 'user_message',
        output: t('elements.interactiveForm.actions.skippedMessage'),
        createdAt: new Date().toISOString(),
        metadata: { formSkipped: true }
      });
    }

    persistFormState(element.forId, element.id, values, extraMessage, showExtra);
    persistToDb(values, extraMessage, showExtra);
    setSubmitted(true);
  }, [
    submitted,
    values,
    extraMessage,
    showExtra,
    isAskFlow,
    askUser,
    sendMessage,
    user?.identifier,
    t,
    element.forId,
    element.id,
    persistToDb
  ]);

  if (!fields.length) {
    return null;
  }

  const isReadOnly = !isLatestMessage || submitted;

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-muted/30 p-2.5 flex flex-col gap-2',
        element.display === 'inline' && 'inline-form w-full max-w-xl',
        isReadOnly && 'select-none pointer-events-none opacity-90 bg-muted/20 [&_input:disabled]:cursor-default [&_textarea:disabled]:cursor-default [&_button:disabled]:cursor-default [&_[data-disabled]]:cursor-default'
      )}
      aria-readonly={isReadOnly}
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
              </Label>
            ) : null}
            <FormFieldRender
              idPrefix={formInstanceId}
              field={field}
              value={values[field.id] ?? (field.value ?? (field.type === 'checkbox' ? false : ''))}
              onChange={(v) => updateValue(field.id, v)}
              disabled={isReadOnly}
            />
          </div>
        ))}
      </div>

      {showExtraMessage ? (
        <div className="flex items-start gap-1.5">
          <input
            type="radio"
            name={`${formInstanceId}-${fields[0]?.id ?? 'selection'}`}
            className="h-4 w-4 mt-1 shrink-0"
            checked={showExtra}
            onChange={selectExtraMessage}
            disabled={isReadOnly}
          />
          <Textarea
            id={`${formInstanceId}-interactive-form-extra`}
            placeholder={t('elements.interactiveForm.extraMessage.placeholder')}
            value={extraMessage}
            onChange={(e) => setExtraMessage(e.target.value)}
            onFocus={() => { if (!showExtra && !isReadOnly) selectExtraMessage(); }}
            className={cn(
              'min-h-[40px] text-sm py-1.5 px-2 flex-1 transition-opacity duration-200 ease-out',
              !showExtra && 'opacity-40',
              isReadOnly && 'resize-none'
            )}
            readOnly={isReadOnly || !showExtra}
            disabled={isReadOnly}
          />
        </div>
      ) : null}

      <div
        className={cn(
          'flex justify-end gap-1.5 overflow-hidden transition-all duration-200 ease-out',
          !isReadOnly ? 'opacity-100 max-h-20 pt-1.5' : 'opacity-0 max-h-0 pt-0'
        )}
        aria-hidden={isReadOnly}
      >
        <div className="flex shrink-0 gap-1.5">
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={!canSubmit}
            aria-disabled={!canSubmit}
          >
            {t('elements.interactiveForm.actions.send')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={submitted}
          >
            {t('elements.interactiveForm.actions.cancel')}
          </Button>
        </div>
      </div>
    </div>
  );
}
