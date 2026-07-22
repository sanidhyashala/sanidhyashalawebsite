export interface ReflectionPrompt {
  id: string;

  title: string;

  description?: string;
}

export const dailyPrompt: ReflectionPrompt = {
  id: "001",

  title: "Can learning exist without comparison?",

  description:
    "Today's invitation is not to answer quickly, but to observe honestly.",
};