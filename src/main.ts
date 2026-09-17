import "./style.css";
import * as THREE from "three";
import * as OBC from "@thatopen/components";
import * as FRAGS from "@thatopen/fragments";

type Selection = {
  model: FRAGS.FragmentsModel;
  modelId: string;
  localId: number;
};

type StoreyOption = {
  model: FRAGS.FragmentsModel;
  localId: number;
  name: string;
};

const container = document.getElementById("container") as HTMLDivElement;
const input = document.getElementById("ifc-input") as HTMLInputElement;
const statusPill = document.getElementById("status-pill") as HTMLDivElement;
const propertiesContent = document.getElementById(
  "properties-content",
) as HTMLDivElement;
const selectionLabel = document.getElementById(
  "selection-label",
) as HTMLElement;
const hideButton = document.getElementById(
  "hide-selected",
) as HTMLButtonElement;
const isolateButton = document.getElementById(
  "isolate-selected",
) as HTMLButtonElement;
const showAllButton = document.getElementById("show-all") as HTMLButtonElement;
const storySelect = document.getElementById("story-select") as HTMLSelectElement;

const main = async () => {
const components = new OBC.Components();
const worlds = components.get(OBC.Worlds);
const world = worlds.create<
  OBC.SimpleScene,
  OBC.OrthoPerspectiveCamera,
  OBC.SimpleRenderer
>();

world.scene = new OBC.SimpleScene(components);
world.scene.setup();
world.scene.three.background = null;

world.renderer = new OBC.SimpleRenderer(components, container);
world.camera = new OBC.OrthoPerspectiveCamera(components);
await world.camera.controls.setLookAt(24, 16, 24, 0, 0, 0);

components.init();
components.get(OBC.Grids).create(world);

const fragments = components.get(OBC.FragmentsManager);
fragments.init(await OBC.FragmentsManager.getWorker());
world.camera.controls.addEventListener("update", () => fragments.core.update());

const ifcLoader = components.get(OBC.IfcLoader);
await ifcLoader.setup({
  autoSetWasm: false,
  wasm: {
    path: "/web-ifc/",
    absolute: true,
  },
});

const highlightMaterial: FRAGS.MaterialDefinition = {
  color: new THREE.Color("#f6c445"),
  renderedFaces: FRAGS.RenderedFaces.TWO,
  opacity: 1,
  transparent: false,
};

let currentSelection: Selection | null = null;
let storeys: StoreyOption[] = [];
let ghostMode = false;

fragments.list.onItemSet.add(({ value: model }) => {
  model.useCamera(world.camera.three);
  world.scene.three.add(model.object);
  fragments.core.update(true);
});

fragments.core.models.materials.list.onItemSet.add(({ value: material }) => {
  if (!("isLodMaterial" in material && material.isLodMaterial)) {
    material.polygonOffset = true;
    material.polygonOffsetUnits = 1;
    material.polygonOffsetFactor = Math.random();
  }
});

const setStatus = (message: string) => {
  statusPill.textContent = message;
};

const setControlsState = () => {
  const hasModel = fragments.list.size > 0;
  const hasSelection = !!currentSelection;
  hideButton.disabled = !hasSelection;
  isolateButton.disabled = !hasSelection;
  showAllButton.disabled = !hasModel;
  storySelect.disabled = !hasModel || storeys.length === 0;
};

const resetModelEmphasis = async () => {
  const promises: Promise<void>[] = [];
  for (const model of fragments.list.values()) {
    promises.push(model.resetOpacity(undefined));
    promises.push(model.resetHighlight(undefined));
  }
  await Promise.all(promises);
  ghostMode = false;
};

const formatValue = (value: unknown) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    if ("value" in value) return formatValue((value as { value: unknown }).value);
    return JSON.stringify(value);
  }
  return String(value);
};

const clearProperties = () => {
  selectionLabel.textContent = "Sin seleccion";
  propertiesContent.className = "empty-panel";
  propertiesContent.textContent =
    "Selecciona un elemento del modelo para revisar sus atributos y property sets.";
};

const renderPropertySet = (
  name: string,
  properties: Record<string, unknown>,
  open = false,
) => {
  const details = document.createElement("details");
  details.className = "pset";
  details.open = open;

  const summary = document.createElement("summary");
  summary.textContent = name;
  details.append(summary);

  const list = document.createElement("dl");
  for (const [key, value] of Object.entries(properties)) {
    const row = document.createElement("div");
    row.className = "property-row";
    const dt = document.createElement("dt");
    dt.textContent = key;
    const dd = document.createElement("dd");
    dd.textContent = formatValue(value);
    row.append(dt, dd);
    list.append(row);
  }

  details.append(list);
  return details;
};

const getItemData = async (selection: Selection) => {
  const [data] = await selection.model.getItemsData([selection.localId], {
    attributesDefault: true,
    relations: {
      IsDefinedBy: { attributes: true, relations: true },
      DefinesOccurrence: { attributes: false, relations: false },
    },
  });
  return data;
};

const readPsets = (itemData: FRAGS.ItemData) => {
  const psets: Record<string, Record<string, unknown>> = {};
  const related = itemData.IsDefinedBy;
  if (!Array.isArray(related)) return psets;

  for (const pset of related as FRAGS.ItemData[]) {
    const psetName = formatValue(pset.Name) || "PropertySet";
    const properties: Record<string, unknown> = {};
    if (!Array.isArray(pset.HasProperties)) continue;

    for (const property of pset.HasProperties as FRAGS.ItemData[]) {
      const name = formatValue(property.Name);
      if (!name) continue;
      properties[name] = formatValue(property.NominalValue);
    }

    psets[psetName] = properties;
  }

  return psets;
};

const renderProperties = async () => {
  if (!currentSelection) {
    clearProperties();
    return;
  }

  const data = await getItemData(currentSelection);
  const name = formatValue(data.Name) || `Local ID ${currentSelection.localId}`;
  selectionLabel.textContent = `${name} · ${currentSelection.modelId}`;
  propertiesContent.className = "";
  propertiesContent.replaceChildren();

  const attributes: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === "IsDefinedBy" || key === "HasProperties") continue;
    if (Array.isArray(value)) continue;
    attributes[key] = formatValue(value);
  }

  propertiesContent.append(renderPropertySet("Atributos", attributes, true));

  const psets = readPsets(data);
  for (const [psetName, properties] of Object.entries(psets).sort()) {
    propertiesContent.append(renderPropertySet(psetName, properties));
  }
};

const clearSelection = async () => {
  if (ghostMode) {
    await resetModelEmphasis();
  } else if (currentSelection) {
    await currentSelection.model.resetHighlight([currentSelection.localId]);
    await currentSelection.model.resetOpacity([currentSelection.localId]);
  }
  currentSelection = null;
  clearProperties();
  setControlsState();
  await fragments.core.update(true);
};

const selectItem = async (selection: Selection) => {
  if (ghostMode) {
    await resetModelEmphasis();
  } else {
    await clearSelection();
  }
  currentSelection = selection;
  await selection.model.highlight([selection.localId], highlightMaterial);
  await renderProperties();
  setControlsState();
  await fragments.core.update(true);
};

const refreshStoreys = async () => {
  storeys = [];
  storySelect.replaceChildren(new Option("Todas", ""));

  for (const model of fragments.list.values()) {
    const byCategory = await model.getItemsOfCategories([/BUILDINGSTOREY/]);
    const localIds = byCategory.IFCBUILDINGSTOREY ?? [];
    if (localIds.length === 0) continue;

    const data = await model.getItemsData(localIds, {
      attributesDefault: false,
      attributes: ["Name"],
    });

    localIds.forEach((localId, index) => {
      const name = formatValue(data[index]?.Name) || `Story ${localId}`;
      const optionIndex = storeys.push({ model, localId, name }) - 1;
      storySelect.add(new Option(name, String(optionIndex)));
    });
  }
};

const fitToLoadedModels = async () => {
  const boxes = await fragments.getBBoxes(
    Object.fromEntries(
      [...fragments.list.keys()].map((modelId) => [modelId, new Set<number>()]),
    ),
  );

  if (boxes.length === 0) return;
  const box = boxes.reduce((target, current) => target.union(current));
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3()).length();
  const distance = Math.max(size * 0.85, 12);
  await world.camera.controls.setLookAt(
    center.x + distance,
    center.y + distance * 0.55,
    center.z + distance,
    center.x,
    center.y,
    center.z,
    true,
  );
};

const zoomToItem = async (selection: Selection) => {
  const boxes = await selection.model.getBoxes([selection.localId]);
  if (!boxes || boxes.length === 0) return;

  const box = boxes.reduce((target, current) => target.union(current.clone()));
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3()).length();
  const distance = Math.max(size * 1.8, 4);

  await world.camera.controls.setLookAt(
    center.x + distance,
    center.y + distance * 0.65,
    center.z + distance,
    center.x,
    center.y,
    center.z,
    true,
  );
};

const loadIfcFile = async (file: File) => {
  setStatus(`Convirtiendo ${file.name} a fragments...`);
  await resetModelEmphasis();
  clearProperties();
  currentSelection = null;
  storySelect.value = "";

  const data = new Uint8Array(await file.arrayBuffer());
  const modelName = file.name.replace(/\.[^.]+$/, "") || "modelo-ifc";

  await ifcLoader.load(data, true, modelName, {
    processData: {
      progressCallback: (progress) => {
        const percent = Math.round(progress * 100);
        setStatus(`Conversion IFC -> fragments: ${percent}%`);
      },
    },
  });

  await refreshStoreys();
  await fitToLoadedModels();
  document.body.classList.add("model-loaded");
  setControlsState();
  setStatus(`${file.name} cargado`);
};

const getSelectionFromClick = async (event: MouseEvent) => {
  const mouse = new THREE.Vector2(event.clientX, event.clientY);
  const result = await fragments.raycast({
    camera: world.camera.three,
    mouse,
    dom: world.renderer!.three.domElement,
  });

  if (!result) return null;
  const model = result.fragments;
  return { model, modelId: model.modelId, localId: result.localId };
};

container.addEventListener("click", async (event) => {
  if (fragments.list.size === 0) return;
  const selection = await getSelectionFromClick(event);
  if (!selection) {
    await clearSelection();
    return;
  }
  await selectItem(selection);
});

document.addEventListener("keydown", async (event) => {
  if (event.key === "Escape") await clearSelection();
});

input.addEventListener("change", async () => {
  const [file] = input.files ?? [];
  if (!file) return;
  try {
    await loadIfcFile(file);
  } catch (error) {
    console.error(error);
    setStatus("No se pudo cargar el IFC");
  } finally {
    input.value = "";
  }
});

hideButton.addEventListener("click", async () => {
  if (!currentSelection) return;
  await resetModelEmphasis();
  await currentSelection.model.setVisible([currentSelection.localId], false);
  await clearSelection();
  setStatus("Elemento oculto");
});

isolateButton.addEventListener("click", async () => {
  if (!currentSelection) return;
  const selection = currentSelection;
  await resetModelEmphasis();

  for (const model of fragments.list.values()) {
    await model.setOpacity(undefined, 0.16);
  }

  await selection.model.resetOpacity([selection.localId]);
  await selection.model.highlight([selection.localId], highlightMaterial);
  await zoomToItem(selection);

  currentSelection = selection;
  ghostMode = true;
  setControlsState();
  await fragments.core.update(true);
  setStatus("Elemento aislado con contexto translucido");
});

showAllButton.addEventListener("click", async () => {
  await resetModelEmphasis();
  for (const model of fragments.list.values()) {
    await model.setVisible(undefined, true);
  }
  currentSelection = null;
  clearProperties();
  storySelect.value = "";
  await fragments.core.update(true);
  setStatus("Modelo completo visible");
});

storySelect.addEventListener("change", async () => {
  const value = storySelect.value;
  await resetModelEmphasis();
  currentSelection = null;
  clearProperties();
  for (const model of fragments.list.values()) {
    await model.setVisible(undefined, true);
  }

  if (value === "") {
    await fragments.core.update(true);
    setStatus("Todas las plantas visibles");
    return;
  }

  const story = storeys[Number(value)];
  if (!story) return;
  const children = await story.model.getItemsChildren([story.localId]);
  for (const model of fragments.list.values()) {
    await model.setVisible(undefined, false);
  }
  await story.model.setVisible(children, true);
  await fragments.core.update(true);
  setStatus(`Filtro activo: ${story.name}`);
});

setControlsState();
};

main().catch((error) => {
  console.error(error);
  statusPill.textContent = "No se pudo iniciar el visor";
});
