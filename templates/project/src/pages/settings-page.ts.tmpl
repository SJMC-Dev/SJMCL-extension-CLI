import type { ExtensionFactoryApi } from "../types/host";
import { useButtonSettings } from "../shared/settings";

const BUTTON_OPTIONS: Array<{
  key: string;
  title: string;
  description: string;
}> = [
  {
    key: "customPageEnabled",
    title: "Custom Page Button",
    description: "Show the button that opens the embedded example page.",
  },
  {
    key: "standalonePageEnabled",
    title: "Standalone Page Button",
    description: "Show the button that opens the standalone example page.",
  },
  {
    key: "documentEnabled",
    title: "Extension Document Button",
    description: "Show the button that opens the SJMCL extension documentation.",
  },
];

export function createSettingsPage(api: ExtensionFactoryApi) {
  const React = api.React;
  const { Switch } = api.ChakraUI;
  const { OptionItem, OptionItemGroup } = api.Components;

  return function SettingsPage() {
    const { settings, hasLoaded, writeSettings } = useButtonSettings(api);
    const [isSaving, setIsSaving] = React.useState(false);

    const handleToggle = React.useCallback(
      function handleToggle(key: string) {
        if (!hasLoaded || isSaving) {
          return;
        }

        const nextSettings = {
          ...settings,
          [key]: !settings[key],
        };

        setIsSaving(true);
        void writeSettings(nextSettings)
          .finally(function finishSaving() {
            setIsSaving(false);
          });
      },
      [hasLoaded, isSaving, settings, writeSettings]
    );

    return React.createElement(OptionItemGroup, {
      title: "Home Example Buttons",
      description:
        "Toggle which buttons are shown in the home-example widget.",
      items: BUTTON_OPTIONS.map(function renderOption(option) {
        return React.createElement(
          OptionItem,
          {
            key: option.key,
            title: option.title,
            description: option.description,
            isChildrenIndependent: true,
          },
          React.createElement(Switch, {
            isChecked: settings[option.key],
            isDisabled: !hasLoaded || isSaving,
            onChange: function onChange() {
              handleToggle(option.key);
            },
          })
        );
      }),
    });
  };
}
