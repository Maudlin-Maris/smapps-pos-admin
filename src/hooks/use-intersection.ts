import { useEffect, useRef, useState, type RefObject } from "react";

const useIntersection = <T extends HTMLElement>({
  rootMargin = "100px",
  element,
  root,
  rootRef,
}: {
  rootMargin?: string;
  element?: T;
  root?: Element | null;
  rootRef?: RefObject<Element | null>;
}) => {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!(ref?.current || element)) return;
    const resolvedRoot = root ?? rootRef?.current ?? null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { rootMargin, root: resolvedRoot },
    );

    const el = element ?? ref?.current;

    if (el) observer?.observe(el);

    return () => {
      observer?.disconnect();
    };
  }, [rootMargin, root, rootRef, element]);

  return { ref, isVisible };
};

export default useIntersection;
