# Shared Map/Area loader — T14

loadWorldRegistry nhận maps (WorldConfig), areas {id,mapId,bounds}, respawns {id,mapId,areaId,x,y}. Map là hệ tọa độ/collision; Area là vùng thuộc Map. Không suy ra quan hệ từ cách đặt tên ID. Nhiều Area có thể dùng cùng Map.

Validator từ chối duplicate IDs, reference không tồn tại/sai Map, Area ngoài bounds Map, polygon sai/tự cắt, footprint default spawn ngoài Area và respawn nằm ngoài Area hoặc trong collision. resolveLocation kiểm cả ba ID; không cho respawn của Area khác. Collision dùng lại pure geometry hiện hữu, không lấy visual bounds.

STARTER_WORLD_REGISTRY export từ shared index, dựng từ STARTER_MAP hiện tại nên FE/BE nhập cùng tọa độ. validateStarter kiểm registry trước transaction Character initialization; các official SAFE/PK/spawn/stats guards giữ nguyên. Chưa triển khai travel hoặc nội dung Map/Area mới.

Tests world-registry.test.ts dùng hai Area kỹ thuật cùng Map; registry-collision.test.ts kiểm building base/tree root/water polygon và roof/canopy walkable. Đây là fixture test, không phải dữ liệu/balance production. Collision Editor, metadata đã chỉnh và OcclusionManager không thay đổi.
