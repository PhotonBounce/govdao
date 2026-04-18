import fs from "node:fs";
import path from "node:path";

const sourcePath = path.resolve(process.cwd(), "..", "..", "config", "mobile-app.manifest.example.json");
const targetPath = path.resolve(process.cwd(), "src", "data", "app.manifest.json");
const checkMode = process.argv.includes("--check");

function isPlainObject(value) {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeArrays(sourceArray, targetArray) {
	if (!Array.isArray(targetArray)) {
		return sourceArray;
	}

	const sourceIsObjectList = sourceArray.every((item) => isPlainObject(item) && typeof item.id === "string");
	const targetIsObjectList = targetArray.every((item) => isPlainObject(item) && typeof item.id === "string");

	if (!sourceIsObjectList || !targetIsObjectList) {
		return targetArray;
	}

	const targetById = new Map(targetArray.map((item) => [item.id, item]));
	const merged = sourceArray.map((sourceItem) => mergeValues(sourceItem, targetById.get(sourceItem.id)));
	const sourceIds = new Set(sourceArray.map((item) => item.id));
	const targetOnly = targetArray.filter((item) => !sourceIds.has(item.id));

	return [...merged, ...targetOnly];
}

function mergeValues(sourceValue, targetValue) {
	if (Array.isArray(sourceValue)) {
		return mergeArrays(sourceValue, targetValue);
	}

	if (isPlainObject(sourceValue)) {
		const targetObject = isPlainObject(targetValue) ? targetValue : {};
		const merged = {};

		for (const key of Object.keys(sourceValue)) {
			merged[key] = mergeValues(sourceValue[key], targetObject[key]);
		}

		for (const key of Object.keys(targetObject)) {
			if (!(key in merged)) {
				merged[key] = targetObject[key];
			}
		}

		return merged;
	}

	return targetValue !== undefined ? targetValue : sourceValue;
}

function readJson(filePath) {
	return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function formatPath(pathSegments) {
	return pathSegments.join(".");
}

function collectSchemaAddedPaths(sourceValue, targetValue, pathSegments = []) {
	if (Array.isArray(sourceValue)) {
		if (!Array.isArray(targetValue)) {
			return pathSegments.length > 0 ? [formatPath(pathSegments)] : [];
		}

		const sourceIsObjectList = sourceValue.every((item) => isPlainObject(item) && typeof item.id === "string");
		const targetIsObjectList = targetValue.every((item) => isPlainObject(item) && typeof item.id === "string");

		if (!sourceIsObjectList || !targetIsObjectList) {
			return [];
		}

		const targetById = new Map(targetValue.map((item) => [item.id, item]));
		return sourceValue.flatMap((item) => collectSchemaAddedPaths(item, targetById.get(item.id), [...pathSegments, item.id]));
	}

	if (isPlainObject(sourceValue)) {
		if (!isPlainObject(targetValue)) {
			return pathSegments.length > 0 ? [formatPath(pathSegments)] : [];
		}

		return Object.keys(sourceValue).flatMap((key) => {
			if (!(key in targetValue)) {
				return [formatPath([...pathSegments, key])];
			}

			return collectSchemaAddedPaths(sourceValue[key], targetValue[key], [...pathSegments, key]);
		});
	}

	return [];
}

function collectPreservedOverridePaths(sourceValue, targetValue, pathSegments = []) {
	if (targetValue === undefined) {
		return [];
	}

	if (Array.isArray(sourceValue)) {
		if (!Array.isArray(targetValue)) {
			return pathSegments.length > 0 && JSON.stringify(sourceValue) !== JSON.stringify(targetValue) ? [formatPath(pathSegments)] : [];
		}

		const sourceIsObjectList = sourceValue.every((item) => isPlainObject(item) && typeof item.id === "string");
		const targetIsObjectList = targetValue.every((item) => isPlainObject(item) && typeof item.id === "string");

		if (!sourceIsObjectList || !targetIsObjectList) {
			return JSON.stringify(sourceValue) !== JSON.stringify(targetValue) && pathSegments.length > 0 ? [formatPath(pathSegments)] : [];
		}

		const sourceById = new Map(sourceValue.map((item) => [item.id, item]));
		const shared = targetValue.filter((item) => sourceById.has(item.id));
		return shared.flatMap((item) => collectPreservedOverridePaths(sourceById.get(item.id), item, [...pathSegments, item.id]));
	}

	if (isPlainObject(sourceValue)) {
		if (!isPlainObject(targetValue)) {
			return pathSegments.length > 0 ? [formatPath(pathSegments)] : [];
		}

		return Object.keys(targetValue).flatMap((key) => {
			if (!(key in sourceValue)) {
				return [];
			}

			return collectPreservedOverridePaths(sourceValue[key], targetValue[key], [...pathSegments, key]);
		});
	}

	return sourceValue !== targetValue && pathSegments.length > 0 ? [formatPath(pathSegments)] : [];
}

function collectLocalOnlyPaths(sourceValue, targetValue, pathSegments = []) {
	if (!isPlainObject(targetValue)) {
		return [];
	}

	const sourceObject = isPlainObject(sourceValue) ? sourceValue : {};
	const localOnlyKeys = Object.keys(targetValue).filter((key) => !(key in sourceObject));
	const directPaths = localOnlyKeys.map((key) => formatPath([...pathSegments, key]));
	const nestedPaths = Object.keys(targetValue)
		.filter((key) => key in sourceObject)
		.flatMap((key) => collectLocalOnlyPaths(sourceObject[key], targetValue[key], [...pathSegments, key]));

	return [...directPaths, ...nestedPaths];
}

function logSummary(title, paths) {
	if (paths.length === 0) {
		return;
	}

	const preview = paths.slice(0, 6);
	console.log(`${title}: ${paths.length}`);
	for (const item of preview) {
		console.log(`- ${item}`);
	}
	if (paths.length > preview.length) {
		console.log(`- ...and ${paths.length - preview.length} more`);
	}
}

function stringifyJson(value) {
	return `${JSON.stringify(value, null, 2)}\n`;
}

fs.mkdirSync(path.dirname(targetPath), { recursive: true });

const sourceManifest = readJson(sourcePath);
const targetManifest = fs.existsSync(targetPath) ? readJson(targetPath) : {};
const mergedManifest = mergeValues(sourceManifest, targetManifest);
const schemaAddedPaths = collectSchemaAddedPaths(sourceManifest, targetManifest);
const preservedOverridePaths = collectPreservedOverridePaths(sourceManifest, targetManifest);
const localOnlyPaths = collectLocalOnlyPaths(sourceManifest, targetManifest);
const mergedText = stringifyJson(mergedManifest);
const currentTargetText = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, "utf8") : "";
const isUpToDate = currentTargetText === mergedText;

if (!checkMode) {
	fs.writeFileSync(targetPath, mergedText, "utf8");
}

console.log(
	checkMode
		? `Checked manifest sync state between ${sourcePath} and ${targetPath}`
		: `Merged manifest schema from ${sourcePath} into ${targetPath} while preserving local overrides`
);
if (schemaAddedPaths.length === 0 && preservedOverridePaths.length === 0 && localOnlyPaths.length === 0) {
	console.log("No schema additions or local override differences were detected.");
} else {
	logSummary("Schema fields added to the mobile manifest", schemaAddedPaths);
	logSummary("Local override paths preserved", preservedOverridePaths);
	logSummary("Local-only paths preserved", localOnlyPaths);
}

if (checkMode) {
	if (isUpToDate) {
		console.log("Manifest is already in sync.");
	} else {
		console.error("Manifest is out of sync. Run npm run mobile:sync-manifest to apply the merged schema.");
		process.exitCode = 1;
	}
}