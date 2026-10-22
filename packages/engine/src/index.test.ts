import { describe, expect, it } from "vitest";
import { advanceUntilChoiceOrEnd, chooseOption, createInitialLife, createSeededRng, stepYear } from "./index";
import { demoData } from "@naitre/data";

describe("moteur de vie déterministe", () => {
  it("rejoue la même naissance avec la même graine", () => {
    const first = createInitialLife("TEST-AUBE", demoData);
    const second = createInitialLife("TEST-AUBE", demoData);
    expect(second).toEqual(first);
    expect(first.territory).toContain("démo");
  });

  it("respecte la pondération de naissance sur une série de tirages", () => {
    const counts = new Map<string, number>();
    for (let index = 0; index < 1000; index += 1) {
      const state = createInitialLife(`WEIGHT-${index}`, demoData);
      counts.set(state.territory, (counts.get(state.territory) ?? 0) + 1);
    }
    expect(counts.get("Territoire A — démo") ?? 0).toBeGreaterThan(counts.get("Territoire D — démo") ?? 0);
  });

  it("applique un choix puis avance sans tirer depuis React", () => {
    let state = createInitialLife("TEST-CHOIX", demoData);
    for (let index = 0; index < 6; index += 1) state = stepYear(state);
    expect(state.pendingChoiceId).toBe("choice-06");
    const learningBefore = state.learning;
    state = chooseOption(state, "atelier");
    expect(state.pendingChoiceId).toBeNull();
    expect(state.decisions).toContain("choice-06:atelier");
    expect(state.learning).toBeGreaterThan(learningBefore);
  });

  it("produit une séquence pseudo-aléatoire stable", () => {
    const a = createSeededRng("seed");
    const b = createSeededRng("seed");
    expect([a.next(), a.next(), a.next()]).toEqual([b.next(), b.next(), b.next()]);
  });

  it("s'arrête au prochain choix sans franchir la décision", () => {
    let state = createInitialLife("TEST-RACCOURCI", demoData);
    state = advanceUntilChoiceOrEnd(state);
    expect(state.age).toBe(6);
    expect(state.pendingChoiceId).toBe("choice-06");

    state = chooseOption(state, "atelier");
    state = advanceUntilChoiceOrEnd(state);
    expect(state.age).toBe(8);
    expect(state.pendingChoiceId).toBe("choice-08");
  });
});
