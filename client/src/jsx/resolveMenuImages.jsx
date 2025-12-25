import { getStorage, ref, getDownloadURL } from "firebase/storage";

const storage = getStorage();

export const resolveMenuImages = async (sections) => {
  const resolvedSections = [];

  for (const section of sections) {
    const itemsWithImages = await Promise.all(
      section.items.map(async (item) => {
        if (!item.img) return item;

        try {
          const imageRef = ref(storage, item.img);
          const imageURL = await getDownloadURL(imageRef);

          return {
            ...item,
            img: imageURL,
          };
        } catch (err) {
          console.error("❌ Image load failed:", item.img);
          return item;
        }
      })
    );

    resolvedSections.push({
      ...section,
      items: itemsWithImages,
    });
  }

  return resolvedSections;
};
