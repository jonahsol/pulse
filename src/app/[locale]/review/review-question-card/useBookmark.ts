import { savedTakesAtom } from "@/logic/atoms";
import { Question, Response } from "@/logic/types";
import { useAtom } from "jotai";
import { useMemo } from "react";

type UseBookmarkProps = {
  response: Response;
  question: Question;
};
export function useBookmark({ response, question }: UseBookmarkProps) {
  const [savedTakes, setSavedTakes] = useAtom(savedTakesAtom);
  const isBookmarked = useMemo(() => {
    return savedTakes.some(
      (savedTake) => savedTake.response.id === response.id,
    );
  }, [savedTakes, response.id]);

  function handleBookmark() {
    if (isBookmarked) {
      setSavedTakes(
        savedTakes.filter((savedTake) => savedTake.response.id !== response.id),
      );
    } else {
      setSavedTakes([
        ...savedTakes,
        {
          id: response.id,
          question: question,
          response: response,
        },
      ]);
    }
  }

  return {
    isBookmarked,
    handleBookmark,
  };
}
