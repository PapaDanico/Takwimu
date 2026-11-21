// The 47 counties of Kenya with their constitutional codes (First Schedule, Constitution of Kenya 2010).
// A county is "published" only when it meets the minimum evidence threshold in docs/data-contract.md.
const COUNTIES = [
  [1, 'Mombasa'], [2, 'Kwale'], [3, 'Kilifi'], [4, 'Tana River'], [5, 'Lamu'], [6, 'Taita-Taveta'], [7, 'Garissa'], [8, 'Wajir'],
  [9, 'Mandera'], [10, 'Marsabit'], [11, 'Isiolo'], [12, 'Meru'], [13, 'Tharaka-Nithi'], [14, 'Embu'], [15, 'Kitui'], [16, 'Machakos'],
  [17, 'Makueni'], [18, 'Nyandarua'], [19, 'Nyeri'], [20, 'Kirinyaga'], [21, "Murang'a"], [22, 'Kiambu'], [23, 'Turkana'], [24, 'West Pokot'],
  [25, 'Samburu'], [26, 'Trans Nzoia'], [27, 'Uasin Gishu'], [28, 'Elgeyo-Marakwet'], [29, 'Nandi'], [30, 'Baringo'], [31, 'Laikipia'], [32, 'Nakuru'],
  [33, 'Narok'], [34, 'Kajiado'], [35, 'Kericho'], [36, 'Bomet'], [37, 'Kakamega'], [38, 'Vihiga'], [39, 'Bungoma'], [40, 'Busia'],
  [41, 'Siaya'], [42, 'Kisumu'], [43, 'Homa Bay'], [44, 'Migori'], [45, 'Kisii'], [46, 'Nyamira'], [47, 'Nairobi City'],
].map(([code, name]) => ({ code, name, slug: name.toLowerCase().replace(/'/g, '').replace(/\s+/g, '-'), published: code === 41 }));
const PUBLISHED = COUNTIES.filter((c) => c.published);
const bySlug = (slug) => COUNTIES.find((c) => c.slug === slug);

// CommonJS so the build scripts (validator, data export) and Next.js read the same list.
module.exports = { COUNTIES, PUBLISHED, bySlug };
