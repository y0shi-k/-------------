import { type ClipboardEvent, type DragEvent, type FocusEvent, useCallback, useState } from "react";

type FileDropTransfer = {
  files: ArrayLike<File>;
  types: {
    includes(value: string): boolean;
  };
};

type UseImageFileDropOptions = {
  disabled?: boolean;
  onFiles: (files: File[]) => void;
};

function isFileTransfer(dataTransfer: FileDropTransfer): boolean {
  return dataTransfer.types.includes("Files");
}

export function extractImageFilesFromDataTransfer(dataTransfer: FileDropTransfer): File[] {
  if (!isFileTransfer(dataTransfer)) return [];
  return Array.from(dataTransfer.files).filter((file) => file.type.startsWith("image/"));
}

export function useImageFileDrop({ disabled = false, onFiles }: UseImageFileDropOptions) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const onDragOver = useCallback(
    (event: DragEvent<HTMLElement>) => {
      if (disabled || !isFileTransfer(event.dataTransfer)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      setIsDraggingOver(true);
    },
    [disabled]
  );

  const onDragLeave = useCallback((event: DragEvent<HTMLElement>) => {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return;
    setIsDraggingOver(false);
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLElement>) => {
      if (disabled || !isFileTransfer(event.dataTransfer)) return;
      event.preventDefault();
      const files = extractImageFilesFromDataTransfer(event.dataTransfer);
      if (files.length > 0) onFiles(files);
      setIsDraggingOver(false);
    },
    [disabled, onFiles]
  );

  // クリック/フォーカスで「アクティブ（貼り付け可）」状態にする。onFocus/onBlur は
  // React 上ではバブルするため focus-within 相当として扱える。
  const onFocus = useCallback(() => {
    if (disabled) return;
    setIsActive(true);
  }, [disabled]);

  const onBlur = useCallback((event: FocusEvent<HTMLElement>) => {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return;
    setIsActive(false);
  }, []);

  // アクティブ（フォーカス内）状態の要素で Ctrl+V されたときだけ発火する。
  // ページ全体には listen しないため、エリア外の貼り付けを奪わない。
  const onPaste = useCallback(
    (event: ClipboardEvent<HTMLElement>) => {
      if (disabled || !event.clipboardData) return;
      const files = extractImageFilesFromDataTransfer(event.clipboardData);
      if (files.length === 0) return;
      event.preventDefault();
      onFiles(files);
    },
    [disabled, onFiles]
  );

  return {
    dragHandlers: {
      onDragLeave,
      onDragOver,
      onDrop
    },
    pasteAreaProps: {
      tabIndex: disabled ? -1 : 0,
      onBlur,
      onFocus,
      onPaste
    },
    isActive,
    isDraggingOver
  };
}
