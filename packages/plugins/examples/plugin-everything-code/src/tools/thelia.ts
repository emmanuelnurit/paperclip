function pascal(input: string): string {
  return input
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join("");
}

export function theliaModuleSkeleton(name: string): string {
  const cls = pascal(name);
  const code = name.toUpperCase().replace(/[^A-Z0-9_]/g, "_");
  return `# Thelia 2.x module: ${cls}

## Layout
\`\`\`
local/modules/${cls}/
├── ${cls}.php
├── Config/
│   ├── module.xml
│   ├── config.xml
│   ├── routing.xml
│   └── schema.xml
├── EventListeners/
├── Loop/
├── Hook/
├── Form/
├── Controller/
├── templates/
│   ├── frontOffice/default/
│   └── backOffice/default/
└── I18n/
\`\`\`

## ${cls}.php
\`\`\`php
<?php

declare(strict_types=1);

namespace ${cls};

use Thelia\\Module\\BaseModule;

class ${cls} extends BaseModule
{
    public const MODULE_DOMAIN = '${code}';
    public const MESSAGE_DOMAIN = '${code.toLowerCase()}';
}
\`\`\`

## Config/module.xml (excerpt)
\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<module xmlns="http://thelia.net/schema/dic/module"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://thelia.net/schema/dic/module http://thelia.net/schema/dic/module/thelia-module.xsd">
    <fullnamespace>${cls}\\${cls}</fullnamespace>
    <descriptive locale="en_US">
        <title>${cls}</title>
        <description>${cls} module</description>
    </descriptive>
    <version>1.0.0</version>
    <author>
        <name>Author</name>
    </author>
    <type>classic</type>
    <thelia>2.5.0</thelia>
</module>
\`\`\`

## Conventions
- Always declare \`MODULE_DOMAIN\` and \`MESSAGE_DOMAIN\` constants.
- Translations under \`I18n/<locale>/<domain>.php\`.
- Public assets under \`templates/<frontOffice|backOffice>/default/assets\`.
- DI via \`Config/config.xml\` (services, listeners, loops, forms).
- Database-bound entities via Propel \`schema.xml\`; run \`thelia module:create-foreign-key-relations\`.
`;
}

export function theliaLoopClass(name: string, table: string): string {
  const cls = pascal(name) + "Loop";
  return `<?php

declare(strict_types=1);

namespace YourModule\\Loop;

use Propel\\Runtime\\ActiveQuery\\Criteria;
use Propel\\Runtime\\Util\\PropelModelPager;
use Thelia\\Core\\Template\\Element\\BaseLoop;
use Thelia\\Core\\Template\\Element\\LoopResult;
use Thelia\\Core\\Template\\Element\\LoopResultRow;
use Thelia\\Core\\Template\\Element\\PropelSearchLoopInterface;
use Thelia\\Core\\Template\\Loop\\Argument\\ArgumentCollection;
use Thelia\\Core\\Template\\Loop\\Argument\\Argument;
use Thelia\\Type\\TypeCollection;
use Thelia\\Type\\EnumListType;

class ${cls} extends BaseLoop implements PropelSearchLoopInterface
{
    protected function getArgDefinitions(): ArgumentCollection
    {
        return new ArgumentCollection(
            Argument::createIntListTypeArgument('id'),
            Argument::createIntTypeArgument('limit', 20),
            new Argument(
                'order',
                new TypeCollection(
                    new EnumListType(['id', 'id_reverse', 'created', 'created_reverse'])
                ),
                'created_reverse'
            ),
        );
    }

    public function buildModelCriteria(): Criteria
    {
        $query = \\YourModule\\Model\\${pascal(table)}Query::create();
        $ids = $this->getId();
        if ($ids !== null) {
            $query->filterById($ids, Criteria::IN);
        }
        $query->limit($this->getLimit());
        return $query;
    }

    public function parseResults(LoopResult $loopResult): LoopResult
    {
        /** @var \\YourModule\\Model\\${pascal(table)} $row */
        foreach ($loopResult->getResultDataCollection() as $row) {
            $loopResultRow = new LoopResultRow($row);
            $loopResultRow->set('ID', $row->getId());
            $loopResult->addRow($loopResultRow);
        }
        return $loopResult;
    }
}
`;
}

export function theliaHookListener(code: string, target: string): string {
  return `<?php

declare(strict_types=1);

namespace YourModule\\Hook;

use Thelia\\Core\\Event\\Hook\\HookRenderEvent;
use Thelia\\Core\\Hook\\BaseHook;

class ${pascal(code)}Hook extends BaseHook
{
    public function on${pascal(target)}(HookRenderEvent $event): void
    {
        $event->add(
            $this->render('${code}.html', [
                'context' => $event->getArguments(),
            ])
        );
    }
}
`;
}

export function theliaTemplateOverride(template: string): string {
  return `# Thelia template override — ${template}

To override the default template without editing core:

1. Copy the original template into your module:
   \`local/modules/YourModule/templates/frontOffice/default/${template}\`
2. Declare the template directory in your module's \`Config/config.xml\`.
3. Use Smarty/TheliaTwig blocks. Avoid duplicating logic — extend instead of replace.

## Smarty example
\`\`\`smarty
{extends file="parent.html"}
{block name="content"}
    <div class="${template.replace(/\..*$/, "")}-extension">
        {hook name="${template.replace(/\..*$/, "")}.before"}
        {\$smarty.block.parent}
        {hook name="${template.replace(/\..*$/, "")}.after"}
    </div>
{/block}
\`\`\`

## Conventions
- Never edit Thelia core templates directly.
- Wrap inserted markup in module-specific CSS classes.
- Use translations from \`MODULE_DOMAIN\` defined in your module.
`;
}
