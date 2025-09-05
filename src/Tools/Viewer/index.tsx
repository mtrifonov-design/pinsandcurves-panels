import { ProjectDataStructure, TimelineController } from '@mtrifonov-design/pinsandcurves-external';
import TimelineProvider, { useTimeline } from '../../LibrariesAndUtils/TimelineUtils/TimelineProvider.js';
import { AssetProvider } from '../../AssetManager/context/AssetProvider.js';
import Setup from './Setup.js';
import JSONAssetProvider, { useJSONAssets } from '../../LibrariesAndUtils/JSONAsset/Provider.js';

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
    const jsonAssets = useJSONAssets();
    const controls = jsonAssets ? jsonAssets["default.controls"] : undefined;
    const image = jsonAssets ? jsonAssets["default.image"] : undefined;
    return <Setup timeline={timeline} controls={controls} image={image} />;
}

export default function Viewer() {
    return <AssetProvider>
        <TimelineProvider
            defaultProject={defaultProject}
            defaultName={"default.timeline"}
            shouldCreate={true}
        >
            <JSONAssetProvider
                defaultName={"default.controls"}
            >
                <JSONAssetProvider
                    defaultName={"default.image"}
                    shouldCreate={true}
                    defaultData={"hello"}
                >
                    <ViewerExterior />
                </JSONAssetProvider>
            </JSONAssetProvider>
        </TimelineProvider>
    </AssetProvider>
}
