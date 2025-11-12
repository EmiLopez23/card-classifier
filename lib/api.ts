export const analyzeCard = async (formData: FormData) => {
  const response = await fetch("/api/analyze-card", {
    method: "POST",
    body: formData,
  });
  return response.json();
};
