/**
 * notion-enhancer: tweaks
 * (c) 2024 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://notion-enhancer.github.io/) under the MIT license
 */

const tweaksId = "5174a483-c88d-4bf8-a95f-35cd330b76e2";
export default async (api, db) => {
  const { getMods } = api,
    [{ options }] = await getMods((mod) => mod.id === tweaksId),
    tweaks = options.filter((opt) => opt.key).map((opt) => opt.key);

  // inc. leading & trailing comma for selectors (see client.css)
  let enabled = ",";
  for (const tweak of tweaks) if (await db.get(tweak)) enabled += tweak + ",";
  document.body.dataset.tweaks = enabled;
};
