const getShortName = (full_name) => {
  if (!full_name) return "";

  const words = full_name.trim().split(" ").filter(Boolean);

  if (words.length === 1) {
    return words[0][0].toUpperCase();
  }

  return (
    words[0][0].toUpperCase() +
    words[1][0].toUpperCase()
  );
};

export default getShortName;