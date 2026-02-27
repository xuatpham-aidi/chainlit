import type { IInteractiveFormElement } from 'client-types/';

import { InteractiveFormElement } from '@/components/Elements/InteractiveForm';

interface Props {
  items: IInteractiveFormElement[];
}

const InlinedInteractiveFormList = ({ items }: Props) => (
  <div className="flex flex-col gap-4">
    {items.map((formElement, index) => (
      <InteractiveFormElement
        key={`interactive-form-${formElement.forId}-${formElement.id}-${index}`}
        element={formElement}
      />
    ))}
  </div>
);

export { InlinedInteractiveFormList };
