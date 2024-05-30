/**
 * notion-enhancer: tweaks
 * (c) 2024 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://notion-enhancer.github.io/) under the MIT license
 */

const tweaksId = "5174a483-c88d-4bf8-a95f-35cd330b76e2";
export default async (api, db) => {
  const { getMods, addKeyListener } = api,
    [{ options }] = await getMods((mod) => mod.id === tweaksId),
    tweaks = options.filter((opt) => opt.key).map((opt) => opt.key),
    values = {};
  for (const tweak of tweaks) values[tweak] = await db.get(tweak);

  // inc. leading & trailing comma for selectors (see client.css)
  document.body.dataset.tweaks =
    "," +
    tweaks
      .filter((tweak) => values[tweak])
      .map((tweak) => {
        if (typeof values[tweak] === "boolean") return tweak;
        return tweak + "=" + values[tweak];
      })
      .join(",") +
    ",";

  if (values["hideSlashMenu"]) {
    addKeyListener("/", () => document.body.click(), true);
  }

  if (values["responsiveColumnsBreakpoint"] > 0) {
    const addResponsiveBreakpoint = () => {
      let breakpoint = values["responsiveColumnsBreakpoint"];
      if (values["responsiveColumnsUnit"] === "Percent") {
        breakpoint /= 100;
        breakpoint *= screen.availWidth;
      }
      if (window.innerWidth <= breakpoint) {
        document.body.setAttribute("data-break-columns", true);
      } else document.body.removeAttribute("data-break-columns");
    };
    window.addEventListener("resize", addResponsiveBreakpoint);
    addResponsiveBreakpoint();
  }
};
