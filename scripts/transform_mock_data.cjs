/**
 * Transform zyla_deal_data.json
 * 
 * For every LEAF parameter, promote the data from the old `drawer` object
 * into the new top-level API keys that the real backend will return.
 * Keep the `drawer` object as-is for backward compatibility.
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'zyla_deal_data.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

function transformNode(node, depth = 0) {
  const isLeaf = !node.children || node.children.length === 0;

  if (isLeaf) {
    // ── Promote drawer data to top-level API keys ──

    // reasoning
    if (!node.reasoning && node.drawer?.reasoning_box?.text) {
      node.reasoning = node.drawer.reasoning_box.text;
    }

    // value_display (same as band)
    if (!node.value_display && node.band) {
      node.value_display = node.band;
    }

    // evidence_tier
    if (!node.evidence_tier) {
      node.evidence_tier = node.drawer?.extracted_source_data ? 'Verified' : 'Not Evidenced';
    }

    // confidence
    if (!node.confidence) {
      node.confidence = node.drawer?.extracted_source_data ? 'high' : 'low';
    }

    // confidence_reason
    if (!node.confidence_reason) {
      node.confidence_reason = node.confidence === 'high'
        ? `${node.name} was verified from source documents.`
        : `No direct source evidence found for ${node.name}.`;
    }

    // as_of
    if (!node.as_of) {
      node.as_of = 'August 2026';
    }

    // period_basis
    if (!node.period_basis) {
      node.period_basis = 'Actual';
    }

    // basis
    if (!node.basis) {
      node.basis = node.drawer?.extracted_source_data?.basis || null;
    }

    // so_what
    if (!node.so_what) {
      node.so_what = null;
    }

    // alternative_reading
    if (!node.alternative_reading) {
      node.alternative_reading = null;
    }

    // data_gaps
    if (!node.data_gaps) {
      node.data_gaps = [];
    }

    // citations — convert from legacy source data
    if (!node.citations || node.citations.length === 0) {
      if (node.drawer?.extracted_source_data?.source_document) {
        const src = node.drawer.extracted_source_data;
        node.citations = [{
          source: src.source_document,
          source_type: 'Company document',
          source_rank: 2,
          source_tier: 2,
          locator: '',
          quote: src.diligence_ask || '',
          retrieved_on: src.source_date || '',
          url: ''
        }];
      } else {
        node.citations = [];
      }
    }

    // scoring_criteria — convert from predefined_system_rubric
    if (!node.scoring_criteria && node.drawer?.predefined_system_rubric) {
      const bands = {};
      for (const r of node.drawer.predefined_system_rubric) {
        bands[r.band] = r.definition;
      }
      node.scoring_criteria = {
        basis: 'Anchor-scored',
        bands: bands,
        evidence_required: null
      };
    } else if (!node.scoring_criteria) {
      node.scoring_criteria = null;
    }

    // weights — compute from the tree position
    if (!node.weights) {
      node.weights = {
        weight_within_parent: node.weight,
        share_of_overall_score: null,
        contribution_to_score: null
      };
    }

  } else {
    // Parent/sub-category — just recurse into children
    if (node.children) {
      for (const child of node.children) {
        transformNode(child, depth + 1);
      }
    }
  }
}

// Transform all categories
for (const cat of data.categories) {
  transformNode(cat);
}

// Write back
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
console.log('Done! Transformed all leaf parameters in zyla_deal_data.json');
