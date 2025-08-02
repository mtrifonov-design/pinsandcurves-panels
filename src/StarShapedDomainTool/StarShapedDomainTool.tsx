import { ProjectDataStructure, TimelineController } from '@mtrifonov-design/pinsandcurves-external';
import TimelineProvider, { useTimeline } from '../TimelineUtils/TimelineProvider.js';
import { AssetProvider } from '../AssetManager/context/AssetProvider.js';
import ControlsProvider, { useControls } from './ControlConsole/ControlProvider.js';
import LiquidLissajousSetup from './StarShapedDomainSetup.js';

const pb = new ProjectDataStructure.ProjectBuilder();
pb.setTimelineData(5000, 30, 45);
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
const defaultName = "echoknight.timeline"


function LiquidLissajousExterior() {
    const timeline = useTimeline();
    const controls = useControls();
    return <LiquidLissajousSetup timeline={timeline} controls={controls} />;
}


export default function LiquidLissajous() {
    return <AssetProvider>
        <TimelineProvider
            defaultProject={defaultProject}
            defaultName={defaultName}
            shouldCreate={true}
        >
            <ControlsProvider>
                <LiquidLissajousExterior />
            </ControlsProvider>
        </TimelineProvider>
    </AssetProvider>;
}
