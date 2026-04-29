/**
 * BÀI 5: AGGREGATION (Thống kê / Phân tích)
 * ===========================================
 * Aggregation cho phép tính toán thống kê trên tập dữ liệu.
 * Tương đương GROUP BY + SUM/AVG/COUNT trong SQL.
 *
 * Các loại aggregation ZincSearch hỗ trợ:
 *   Metric:  min, max, avg, sum, count
 *   Bucket:  terms, range, date_histogram
 *   Nesting: aggs lồng trong aggs
 *
 * ⚠️  ZincSearch ít loại agg hơn Elasticsearch (không có cardinality,
 *     percentiles, geo, pipeline aggregations...)
 */

const zinc = require('../zinc_client');

const INDEX_NAME = 'demo_products';

function printAggs(aggs) {
  JSON.stringify(aggs, null, 2).split('\n').forEach(l => console.log('  ', l));
}

async function run() {
  console.log('='.repeat(60));
  console.log('BÀI 5: AGGREGATION - ZincSearch');
  console.log('='.repeat(60));

  // ─────────────────────────────────────────────────
  // 1. METRIC AGGREGATIONS - Tính số liệu
  //    min, max, avg, sum
  // ─────────────────────────────────────────────────
  console.log('\n--- 1. Metric Aggregations (min/max/avg/sum) ---');
  const metricRes = await zinc.post(`/es/${INDEX_NAME}/_search`, {
    size: 0,  // Không cần document, chỉ lấy aggregation
    aggs: {
      min_price:  { min: { field: 'price' } },
      max_price:  { max: { field: 'price' } },
      avg_price:  { avg: { field: 'price' } },
      total_value: { sum: { field: 'price' } },
      avg_rating: { avg: { field: 'rating' } }
    }
  });
  const m = metricRes.data.aggregations;
  if (m) {
    console.log(`  Giá thấp nhất:  ${m.min_price?.value?.toLocaleString()}đ`);
    console.log(`  Giá cao nhất:   ${m.max_price?.value?.toLocaleString()}đ`);
    console.log(`  Giá trung bình: ${m.avg_price?.value?.toLocaleString()}đ`);
    console.log(`  Rating TB:      ${m.avg_rating?.value?.toFixed(2)}`);
  }

  // ─────────────────────────────────────────────────
  // 2. TERMS AGGREGATION - Nhóm theo giá trị
  //    Tương đương: SELECT category, COUNT(*) FROM ... GROUP BY category
  // ─────────────────────────────────────────────────
  console.log('\n--- 2. Terms Aggregation (group by category) ---');
  const termsRes = await zinc.post(`/es/${INDEX_NAME}/_search`, {
    size: 0,
    aggs: {
      by_category: {
        terms: {
          field: 'category',
          size: 10,           // Tối đa 10 nhóm
          order: { _count: 'desc' }  // Sắp theo số lượng giảm dần
        }
      }
    }
  });
  const catBuckets = termsRes.data.aggregations?.by_category?.buckets || [];
  catBuckets.forEach(b => {
    console.log(`  • ${b.key}: ${b.doc_count} sản phẩm`);
  });

  // ─────────────────────────────────────────────────
  // 3. TERMS + NESTED METRIC - Nhóm + tính số liệu
  //    Tương đương: GROUP BY brand với AVG(price), MAX(rating)
  // ─────────────────────────────────────────────────
  console.log('\n--- 3. Nested Agg: Group by brand + avg price ---');
  const nestedRes = await zinc.post(`/es/${INDEX_NAME}/_search`, {
    size: 0,
    aggs: {
      by_brand: {
        terms: { field: 'brand', size: 10 },
        aggs: {
          avg_price_per_brand: { avg: { field: 'price' } },
          max_rating:          { max: { field: 'rating' } },
          product_count:       { value_count: { field: 'name' } }
        }
      }
    }
  });
  const brandBuckets = nestedRes.data.aggregations?.by_brand?.buckets || [];
  brandBuckets.forEach(b => {
    console.log(`  • ${b.key}:`);
    console.log(`    - Sản phẩm: ${b.doc_count}`);
    console.log(`    - Giá TB:   ${b.avg_price_per_brand?.value?.toLocaleString()}đ`);
    console.log(`    - Rating Max: ${b.max_rating?.value}`);
  });

  // ─────────────────────────────────────────────────
  // 4. RANGE AGGREGATION - Nhóm theo khoảng
  //    Phân khúc giá sản phẩm
  // ─────────────────────────────────────────────────
  console.log('\n--- 4. Range Aggregation (phân khúc giá) ---');
  const rangeRes = await zinc.post(`/es/${INDEX_NAME}/_search`, {
    size: 0,
    aggs: {
      price_range: {
        range: {
          field: 'price',
          ranges: [
            { key: 'Phổ thông',   to:   10000000 },
            { key: 'Tầm trung',   from: 10000000, to: 25000000 },
            { key: 'Cao cấp',     from: 25000000, to: 45000000 },
            { key: 'Siêu cao cấp',from: 45000000 }
          ]
        }
      }
    }
  });
  const priceBuckets = rangeRes.data.aggregations?.price_range?.buckets || [];
  priceBuckets.forEach(b => {
    console.log(`  • [${b.key}]: ${b.doc_count} sản phẩm`);
  });

  // ─────────────────────────────────────────────────
  // 5. FILTER + AGGREGATION - Thống kê có điều kiện
  //    Chỉ tính agg trên subset data
  // ─────────────────────────────────────────────────
  console.log('\n--- 5. Filter + Agg (chỉ tính trên smartphone còn hàng) ---');
  const filteredAggRes = await zinc.post(`/es/${INDEX_NAME}/_search`, {
    size: 0,
    query: {
      bool: {
        must: [{ term: { category: 'smartphone' } }],
        filter: [{ term: { in_stock: true } }]
      }
    },
    aggs: {
      avg_price: { avg: { field: 'price' } },
      by_brand:  { terms: { field: 'brand', size: 5 } }
    }
  });
  const fa = filteredAggRes.data.aggregations;
  console.log(`  Giá TB smartphone còn hàng: ${fa?.avg_price?.value?.toLocaleString()}đ`);
  (fa?.by_brand?.buckets || []).forEach(b =>
    console.log(`  • ${b.key}: ${b.doc_count} sản phẩm`)
  );

  console.log('\n✅ BÀI 5 HOÀN THÀNH');

  /*
   * ═══════════════════════════════════════════════
   * AGGREGATION: ZincSearch vs Elasticsearch
   * ═══════════════════════════════════════════════
   *
   * | Loại Agg          | ZincSearch | Elasticsearch |
   * |--------------------|------------|---------------|
   * | min/max/avg/sum    | ✅          | ✅             |
   * | value_count        | ✅          | ✅             |
   * | terms              | ✅          | ✅             |
   * | range              | ✅          | ✅             |
   * | date_histogram     | ✅          | ✅             |
   * | histogram          | ✅          | ✅             |
   * | cardinality        | ❌          | ✅             |
   * | percentiles        | ❌          | ✅             |
   * | geo_bounds         | ❌          | ✅             |
   * | pipeline aggs      | ❌          | ✅             |
   * | scripted metric    | ❌          | ✅             |
   */
}

run().catch(console.error);
