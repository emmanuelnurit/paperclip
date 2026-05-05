function pascal(input: string): string {
  return input
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join("");
}

function snake(input: string): string {
  return input
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .toLowerCase();
}

export function symfonyController(name: string): string {
  const cls = pascal(name) + "Controller";
  return `<?php

declare(strict_types=1);

namespace App\\Controller;

use Symfony\\Bundle\\FrameworkBundle\\Controller\\AbstractController;
use Symfony\\Component\\HttpFoundation\\JsonResponse;
use Symfony\\Component\\HttpFoundation\\Request;
use Symfony\\Component\\Routing\\Attribute\\Route;

#[Route('/api/${snake(name)}', name: '${snake(name)}_')]
final class ${cls} extends AbstractController
{
    #[Route('', name: 'index', methods: ['GET'])]
    public function index(Request $request): JsonResponse
    {
        return $this->json(['ok' => true]);
    }
}
`;
}

export function symfonyService(name: string): string {
  const cls = pascal(name) + "Service";
  return `<?php

declare(strict_types=1);

namespace App\\Service;

use Psr\\Log\\LoggerInterface;

final readonly class ${cls}
{
    public function __construct(
        private LoggerInterface $logger,
    ) {
    }

    public function handle(string $input): string
    {
        $this->logger->info('${cls}: handling', ['input' => $input]);
        return strtoupper($input);
    }
}
`;
}

export function symfonyEntity(name: string): string {
  const cls = pascal(name);
  const table = snake(name);
  return `<?php

declare(strict_types=1);

namespace App\\Entity;

use App\\Repository\\${cls}Repository;
use Doctrine\\ORM\\Mapping as ORM;
use Symfony\\Bridge\\Doctrine\\IdGenerator\\UuidGenerator;
use Symfony\\Component\\Uid\\Uuid;

#[ORM\\Entity(repositoryClass: ${cls}Repository::class)]
#[ORM\\Table(name: '${table}')]
class ${cls}
{
    #[ORM\\Id]
    #[ORM\\Column(type: 'uuid', unique: true)]
    #[ORM\\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\\CustomIdGenerator(class: UuidGenerator::class)]
    private ?Uuid $id = null;

    #[ORM\\Column(length: 200)]
    private string $name;

    #[ORM\\Column]
    private \\DateTimeImmutable $createdAt;

    public function __construct(string $name)
    {
        $this->name = $name;
        $this->createdAt = new \\DateTimeImmutable();
    }

    public function getId(): ?Uuid { return $this->id; }
    public function getName(): string { return $this->name; }
    public function getCreatedAt(): \\DateTimeImmutable { return $this->createdAt; }
}
`;
}

export function symfonyForm(name: string): string {
  const cls = pascal(name) + "Type";
  return `<?php

declare(strict_types=1);

namespace App\\Form;

use Symfony\\Component\\Form\\AbstractType;
use Symfony\\Component\\Form\\Extension\\Core\\Type\\TextType;
use Symfony\\Component\\Form\\FormBuilderInterface;
use Symfony\\Component\\OptionsResolver\\OptionsResolver;
use Symfony\\Component\\Validator\\Constraints\\Length;
use Symfony\\Component\\Validator\\Constraints\\NotBlank;

final class ${cls} extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder->add('name', TextType::class, [
            'constraints' => [new NotBlank(), new Length(min: 2, max: 200)],
        ]);
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults(['data_class' => null]);
    }
}
`;
}

export function symfonyVoter(name: string): string {
  const cls = pascal(name) + "Voter";
  return `<?php

declare(strict_types=1);

namespace App\\Security;

use Symfony\\Bundle\\SecurityBundle\\Security;
use Symfony\\Component\\Security\\Core\\Authentication\\Token\\TokenInterface;
use Symfony\\Component\\Security\\Core\\Authorization\\Voter\\Voter;

final class ${cls} extends Voter
{
    public const VIEW = 'view';
    public const EDIT = 'edit';

    public function __construct(private readonly Security $security) {}

    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::VIEW, self::EDIT], true);
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        $user = $token->getUser();
        if ($user === null) return false;
        return match ($attribute) {
            self::VIEW => true,
            self::EDIT => $this->security->isGranted('ROLE_ADMIN'),
            default => false,
        };
    }
}
`;
}

export function symfonyDoctrineEntity(spec: string): string {
  return `// Doctrine entity for: ${spec}
// Use #[ORM\\Entity], #[ORM\\Table], typed properties with #[ORM\\Column].
// Identifiers: prefer Uuid v7 with UuidGenerator. Avoid auto-increment in distributed scenarios.
// Keep value objects (Money, Address) as embedded (#[ORM\\Embedded]).
// Use \\DateTimeImmutable everywhere, never \\DateTime.
${symfonyEntity(spec.split(/\s+/)[0] ?? "Item")}`;
}

export function symfonyDoctrineRepository(spec: string): string {
  const cls = pascal(spec.split(/\s+/)[0] ?? "Item");
  return `<?php

declare(strict_types=1);

namespace App\\Repository;

use App\\Entity\\${cls};
use Doctrine\\Bundle\\DoctrineBundle\\Repository\\ServiceEntityRepository;
use Doctrine\\Persistence\\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<${cls}>
 */
class ${cls}Repository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ${cls}::class);
    }

    public function findRecent(int $limit = 20): array
    {
        return $this->createQueryBuilder('e')
            ->orderBy('e.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }
}
`;
}

export function symfonyDoctrineMigration(spec: string): string {
  const ts = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
  return `<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\\DBAL\\Schema\\Schema;
use Doctrine\\Migrations\\AbstractMigration;

final class Version${ts} extends AbstractMigration
{
    public function getDescription(): string
    {
        return ${JSON.stringify(spec)};
    }

    public function up(Schema $schema): void
    {
        // Forward migration. Keep idempotent where possible.
        $this->addSql("CREATE TABLE example (id UUID PRIMARY KEY, name VARCHAR(200) NOT NULL, created_at TIMESTAMPTZ NOT NULL)");
    }

    public function down(Schema $schema): void
    {
        $this->addSql("DROP TABLE example");
    }
}
`;
}

export function symfonyDoctrineQuery(spec: string): string {
  return `// DBAL/QueryBuilder snippet for: ${spec}
// Prefer Doctrine QueryBuilder for portable queries. Drop to DBAL for
// performance-critical or vendor-specific paths. Always parameterize.
$qb = $em->createQueryBuilder()
    ->select('e')
    ->from(${"'\\App\\Entity\\Example'"}, 'e')
    ->where('e.status = :status')
    ->setParameter('status', 'active')
    ->orderBy('e.createdAt', 'DESC')
    ->setMaxResults(50);
return $qb->getQuery()->getResult();
`;
}

export function symfonyTestPlan(target: string, framework: "phpunit" | "pest"): string {
  const intro = `# ${framework === "pest" ? "Pest" : "PHPUnit"} test plan — ${target}`;
  return `${intro}

## Layered tests
- Unit: pure logic, no DB / HTTP. Use stubs for ports.
- Integration: kernel boot + Doctrine + service container.
- Functional: WebTestCase (or Pest equivalent) for HTTP routes.
- E2E: optional, only for critical user flows.

## Conventions
- Arrange / Act / Assert structure.
- One behavior per test, descriptive names.
- Fixtures via DataFixtures + zenstruck/foundry; no fragile dataset coupling.
- Time freezing with Carbon::setTestNow or Clock interface.

## Skeleton
\`\`\`php
final class ${target.replace(/[^A-Za-z0-9]/g, "")}Test extends ${framework === "pest" ? "TestCase" : "WebTestCase"}
{
    public function test_it_does_what_it_says(): void
    {
        // arrange
        // act
        // assert
        $this->assertTrue(true);
    }
}
\`\`\`
`;
}
