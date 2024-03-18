# Marketplace - Backend

## Installation

```bash
$ yarn install
```

## Prepare the environment

```bash
cd docker
docker-compose up -d # start local services
```

In `packages/backend` folder, copy the `.env` file to `.env.local` file.

```bash
PORT=3001

AWS_REGION=us-west-2

## DynamoDB config
DYNAMO_ENDPOINT=http://localhost:8000
DYNAMODB_TABLE_PREFIX=local-
DYNAMO_ACCESS_KEY_ID=
DYNAMO_SECRET_ACCESS_KEY=
DYNAMO_REGION=
```

> The `.env` should contains default variables only, please DON'T put any credentials to the `.env` file

## Running the app

From `packages/backend`

```bash
# development
$ yarn dev
# 🚀 API server listenning on http://localhost:3001/api

# production mode
$ npm start
```

To start the app from root directory

```bash
yarn backend dev
```

## Tech stack

- [NestJS](https://docs.nestjs.com/) as framework
- [DynamoDB](https://aws.amazon.com/dynamodb/) as main database
- [Dyngoose](https://github.com/benhutchins/dyngoose) for DynamoDB integration
- [class-transformer](https://github.com/typestack/class-transformer) & [class-validator](https://github.com/typestack/class-validator) for serialization & input validation
- [Swagger](https://docs.nestjs.com/openapi/introduction)
- [Elasticsearch](https://www.elastic.co/elasticsearch/) as secondary database (for full-text search and complex filtering)

## DynamoDB modeling with Dyngoose

```typescript
import { Dyngoose } from 'dyngoose';

const { $Table, Attribute } = Dyngoose;

@$Table({ name: `${process.env.DYNAMO_TABLE_PREFIX ?? ''}Like` })
export class Like extends Dyngoose.Table {
  @Dyngoose.$PrimaryKey('collectionId', 'SK')
  static readonly primaryKey: Dyngoose.Query.PrimaryKey<Like, string, string>;

  @Dyngoose.$GlobalSecondaryIndex({ hashKey: 'owner', rangeKey: 'SK' })
  static readonly ownerGsi: Dyngoose.Query.GlobalSecondaryIndex<Like>;

  @Attribute.String({ required: true })
  private SK: string;

  @Attribute.String({ required: true, lowercase: true })
  collectionId: string;

  @Attribute.String({ required: true })
  itemId: string;

  @Attribute.String({ required: true, lowercase: true })
  owner: string;

  protected async beforeSave(): Promise<boolean> {
    this.SK = `${this.collectionId}#${this.itemId}#${this.owner}`;
    return true;
  }
}
```

## Input Validation

To enforce input validation, use validation decorators from `class-validator` package.

```typescript
import { IsNotEmpty } from 'class-validator';
import { Dyngoose } from 'dyngoose';

const { $Table, Attribute } = Dyngoose;

@$Table({ name: `${process.env.DYNAMO_TABLE_PREFIX ?? ''}Like` })
export class Like extends Dyngoose.Table {
	...

  @IsNotEmpty()
  @Attribute.String({ required: true, lowercase: true })
  collectionId: string;

  @IsNotEmpty()
  @Attribute.String({ required: true })
  itemId: string;

  @IsNotEmpty()
  @Attribute.String({ required: true, lowercase: true })
  owner: string;

	...
}
```

## Swagger

Decorating input DTOs and response models with `@ApiProperty()`

```typescript
import { IsNotEmpty } from 'class-validator';
import { Dyngoose } from 'dyngoose';
import { ApiProperty } from '@nestjs/swagger';

const { $Table, Attribute } = Dyngoose;

@$Table({ name: `${process.env.DYNAMO_TABLE_PREFIX ?? ''}Like` })
export class Like extends Dyngoose.Table {
	...

  @ApiProperty()
  @IsNotEmpty()
  @Attribute.String({ required: true, lowercase: true })
  collectionId: string;

  @ApiProperty()
  @IsNotEmpty()
  @Attribute.String({ required: true })
  itemId: string;

  @ApiProperty()
  @IsNotEmpty()
  @Attribute.String({ required: true, lowercase: true })
  owner: string;

	...
}
```

Decorating controllers and request handlers with `@ApiOkResponse()`

```typescript
@ApiTags('collections')
@Controller('/collections')
export class CollectionController {
  constructor(private readonly collectionSvc: CollectionService) {}

  @ApiOkResponse({ type: Collection, isArray: true })
  @Get('/')
  async getAll(@Query() query: GetCollectionReqDto) {
    const result = await this.collectionSvc.getAll(query);

    return {
      data: result,
      hasNext: !!result.lastEvaluatedKey,
      next: result.lastEvaluatedKey,
    };
  }

  @ApiOkResponse({ type: Collection })
  @Get('/:id')
  async getById(@Param('id') id: string) {
    return this.collectionSvc.getById(id);
  }
}
```
