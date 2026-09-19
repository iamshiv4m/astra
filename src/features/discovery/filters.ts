import type { Astrologer } from "@/types/domain";

export interface DiscoveryFilters {
  search: string;
  specialty: string;
  experience: string;
  language: string;
  price: string;
  rating: string;
  availability: string;
  gender: string;
  sort: string;
}

export const defaultFilters: DiscoveryFilters = {
  search: "",
  specialty: "",
  experience: "",
  language: "",
  price: "",
  rating: "",
  availability: "",
  gender: "",
  sort: "recommended",
};

export function filterAstrologers(
  astrologers: Astrologer[],
  filters: DiscoveryFilters,
  availableIds: Set<string> = new Set()
): Astrologer[] {
  const search = filters.search.trim().toLocaleLowerCase();
  return astrologers
    .filter(advisor => {
      const searchable = [advisor.name, advisor.specialty, ...advisor.expertise].join(" ").toLocaleLowerCase();
      return (
        (!search || searchable.includes(search)) &&
        (!filters.specialty || advisor.specialty === filters.specialty) &&
        (!filters.experience || advisor.experience >= Number(filters.experience)) &&
        (!filters.language || advisor.languages.includes(filters.language)) &&
        (!filters.price || advisor.prices[30] <= Number(filters.price) * 100) &&
        (!filters.rating || advisor.rating >= Number(filters.rating)) &&
        (!filters.availability || availableIds.has(advisor.id)) &&
        (!filters.gender || advisor.gender === filters.gender)
      );
    })
    .sort((a, b) => {
      if (filters.sort === "rating") return b.rating - a.rating;
      if (filters.sort === "experience") return b.experience - a.experience;
      if (filters.sort === "price") return a.prices[30] - b.prices[30];
      return Number(b.featured) - Number(a.featured) || b.rating - a.rating;
    });
}
