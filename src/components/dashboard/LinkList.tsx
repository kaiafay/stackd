"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { KeyboardSensor } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import LinkItem from "./LinkItem";
import SectionHeader from "./SectionHeader";
import type { Link } from "@/types";

type Props = {
  links: Link[];
  onUpdate: (
    id: string,
    updates: Partial<Pick<Link, "title" | "subtitle" | "url" | "enabled">>,
  ) => Promise<{ error: { message: string } | null }>;
  onDelete: (id: string) => Promise<{ error: { message: string } | null }>;
  onReorder: (links: Link[]) => void;
};

function SortableLinkItem({
  link,
  onUpdate,
  onDelete,
}: {
  link: Link;
  onUpdate: Props["onUpdate"];
  onDelete: Props["onDelete"];
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <LinkItem
        link={link}
        onUpdate={onUpdate}
        onDelete={onDelete}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

function SortableSectionHeader({
  link,
  onUpdate,
  onDelete,
}: {
  link: Link;
  onUpdate: Props["onUpdate"];
  onDelete: Props["onDelete"];
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <SectionHeader
        link={link}
        onUpdate={onUpdate}
        onDelete={onDelete}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

export default function LinkList({
  links,
  onUpdate,
  onDelete,
  onReorder,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = links.findIndex((l) => l.id === active.id);
      const newIndex = links.findIndex((l) => l.id === over.id);
      onReorder(arrayMove(links, oldIndex, newIndex));
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={links.map((l) => l.id)}
        strategy={verticalListSortingStrategy}
      >
        {links.map((link) =>
          link.kind === "section" ? (
            <SortableSectionHeader
              key={link.id}
              link={link}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ) : (
            <SortableLinkItem
              key={link.id}
              link={link}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ),
        )}
      </SortableContext>
    </DndContext>
  );
}
