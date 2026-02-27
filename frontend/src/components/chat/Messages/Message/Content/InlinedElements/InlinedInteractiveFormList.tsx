import type { IInteractiveFormElement } from 'client-types/';

import { InteractiveFormElement } from '@/components/Elements/InteractiveForm';

interface Props {
  items: IInteractiveFormElement[];
  isLatestMessage?: boolean;
}

const InlinedInteractiveFormList = ({ items, isLatestMessage = true }: Props) => (
  <div className="flex flex-col gap-4">
    {items.map((formElement, index) => (
      <InteractiveFormElement
        key={`interactive-form-${formElement.forId}-${formElement.id}-${index}`}
        element={formElement}
        isLatestMessage={isLatestMessage}
      />
    ))}
  </div>
);

export { InlinedInteractiveFormList };
