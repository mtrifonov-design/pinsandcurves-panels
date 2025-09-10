import { ProjectDataStructure, TimelineController } from '@mtrifonov-design/pinsandcurves-external';
import TimelineProvider, { useTimeline } from '../../LibrariesAndUtils/TimelineUtils/TimelineProvider.js';
import { AssetProvider } from '../../AssetManager/context/AssetProvider.js';
import Setup from './Setup.js';
import { useJSONAssets, JSONAssetCreator } from '../../LibrariesAndUtils/JSONAsset/Provider.js';
import FullscreenLoader from '../../LibrariesAndUtils/FullscreenLoader/FullscreenLoader.js';

const pb = new ProjectDataStructure.ProjectBuilder();
pb.setTimelineData(3500, 30, 45);
pb.addContinuousSignal('s1', 'Unused Signal', [0, 1]);
pb.addContinuousSignal('cx', 'Center X', [0, 1]);
pb.addPin('cx', 0, 0, 'return easyLinear()');
pb.addPin('cx', 50, 1, 'return easyLinear()');
pb.addPin('cx', 900, 1, 'return easyLinear()');
pb.addContinuousSignal('cy', 'Center Y', [0, 1]);
pb.addPin('cy', 0, 0, 'return easyLinear()');
pb.addPin('cy', 50, 1, 'return easyLinear()');
pb.addPin('cy', 900, 1, 'return easyLinear()');
pb.setSignalActiveStatus('s1', true);
pb.setSignalActiveStatus('cx', false);
pb.setSignalActiveStatus('cy', false);
const defaultProject = () => {
    const project = pb.getProject();
    const controller = TimelineController.TimelineController.fromProject(project);
    const serialised = controller.serialize();
    return serialised;
}
function ViewerExterior() {
    const timeline = useTimeline();
    const { initialized, assets: jsonAssets, index } = useJSONAssets((id: string, metadata: any) => {
        if (metadata.type === "controls") {
            return true;
        }
        if (metadata.type === "graphics") {
            return true;
        }
        if (id === "default.composition" && metadata.type === "composition") {
            return true;
        }
        return false;
    });
    const composition = initialized ? jsonAssets["default.composition"] : undefined;
    const controlsIds = initialized ? index ? Object.keys(index.data).filter(id => index.data[id].type === "controls") : [] : [];
    const graphicsIds = initialized ? index ? Object.keys(index.data).filter(id => index.data[id].type === "graphics") : [] : [];
    const controls = Object.entries(jsonAssets).filter(([id, asset]) => controlsIds.includes(id));
    const graphics = Object.entries(jsonAssets).filter(([id, asset]) => graphicsIds.includes(id));
    if (!initialized || !composition || !timeline) {
        return <FullscreenLoader />
    }
    //console.log(composition)
    return <Setup timeline={timeline} composition={composition.data} controls={controls} graphics={graphics} />;
}

export default function Viewer() {
    return <AssetProvider>
        <TimelineProvider
            defaultProject={defaultProject}
            defaultName={"default.timeline"}
            shouldCreate={true}
        >
                    <ViewerExterior />
        </TimelineProvider>
    </AssetProvider>
}
