import { AssetProvider } from "../context/AssetProvider";
import { useIndex } from "../hooks/useIndex";


function AssetTestPanelContent() {
    const { initialized, index} = useIndex();
    console.log("AssetTestPanelContent initialized:", initialized, "index:", index);

    return <div>
        <h1>Asset Test Panel</h1>
        <p>This is a placeholder for the Asset Test Panel content.</p>
        {/* Add more content or components as needed */}
    </div>;
}

function AssetTestPanel() {
    return <AssetProvider>
        <AssetTestPanelContent />
    </AssetProvider>
}

export default AssetTestPanel;