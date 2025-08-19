<?php
/**
 * Signature Randomizer (v0.9.5)
 * Weighted per-identity signatures with random insertion and a theme-native UI.
 * PHP 7.4+ compatible.
 */
class signature_randomizer extends rcube_plugin
{
    public $task = 'settings|mail';
    private $rc;
    private $prefs_key = 'sr_variants';

    public function init()
    {
        $this->rc = rcube::get_instance();
        $this->load_config();
        $this->add_texts('localization/');

        $this->add_label(array(
            'sr_title','sr_section','sr_enable','sr_manager','sr_include','sr_name','sr_weight','sr_actions',
            'sr_add','sr_save','sr_delete','sr_duplicate','sr_move_up','sr_move_down','sr_preview','sr_shuffle',
            'sr_shuffle_preview','sr_export','sr_import','sr_import_paste','sr_no_variants','sr_saved','sr_invalid_json',
            'sr_new_variant','sr_html','sr_preview_title','sr_import_btn','sr_export_title','sr_import_title','sr_toolbar_shuffle'
        ));

        // Settings UI + AJAX endpoints
        $this->add_hook('identity_form', array($this, 'identity_form'));
        $this->register_action('plugin.sr_get_variants', array($this, 'action_get_variants'));
        $this->register_action('plugin.sr_save_variant', array($this, 'action_save_variant'));
        $this->register_action('plugin.sr_delete_variant', array($this, 'action_delete_variant'));
        $this->register_action('plugin.sr_duplicate_variant', array($this, 'action_duplicate_variant'));
        $this->register_action('plugin.sr_reorder_variants', array($this, 'action_reorder_variants'));
        $this->register_action('plugin.sr_export', array($this, 'action_export'));
        $this->register_action('plugin.sr_import', array($this, 'action_import'));

        // Preferences (Composing → Signature Options)
        $this->add_hook('preferences_list', array($this, 'prefs_list'));
        $this->add_hook('preferences_save', array($this, 'prefs_save'));

        // Compose integration — register regardless of current action; gate inside handler
        $this->add_hook('render_page', array($this, 'compose_render'));

        // Assets
        $this->include_script('js/sr_identities.js');
        $this->include_script('js/sr_compose.js');
        $this->include_stylesheet($this->local_skin_path() . '/signature_randomizer.css');
    }

    /** Place checkbox directly below "Force standard separator in signatures" */
    public function prefs_list($args)
    {
        if ($args['section'] !== 'compose') {
            return $args;
        }

        $enabled = !empty($this->rc->user->get_prefs()['sr_enabled']);
        $cb = new html_checkbox(array('name'=>'_sr_enabled','id'=>'sr_enabled','value'=>1,'class'=>'checkbox'));
        $opt = array('title'=>$this->gettext('sr_enable'),'content'=>$cb->show($enabled ? 1 : 0));

        if (isset($args['blocks']['sig']) && isset($args['blocks']['sig']['options'])) {
            $out = array();
            $inserted = false;
            foreach ($args['blocks']['sig']['options'] as $key => $row) {
                $out[$key] = $row;
                // The native key is 'sig_separator'; also detect by label id in rendered content for safety
                if ($key === 'sig_separator' || (is_array($row) && isset($row['content']) && strpos((string)$row['content'], 'rcmfd_sig_separator') !== false)) {
                    $out['zz_sr_enable'] = $opt;
                    $inserted = true;
                }
            }
            if (!$inserted) {
                $out['zz_sr_enable'] = $opt; // fallback
            }
            $args['blocks']['sig']['options'] = $out;
        } else {
            // ultimate fallback: create a block
            $args['blocks']['sig'] = array(
                'name' => $this->gettext('sr_section'),
                'options' => array('zz_sr_enable' => $opt)
            );
        }
        return $args;
    }

    public function prefs_save($args)
    {
        if ($args['section'] !== 'compose') {
            return $args;
        }
        $args['prefs']['sr_enabled'] = !empty($_POST['_sr_enabled']) ? 1 : 0;
        return $args;
    }

    /** Identity form block */
    public function identity_form($args)
    {
        if (!empty($args['record']['identity_id'])) {
            $this->rc->output->set_env('sr_identity_id', $args['record']['identity_id']);
        }
        $this->rc->output->set_env('request_token', $this->rc->get_request_token());

        $content  = html::tag('div', array('id'=>'sr-manager','class'=>'sr-manager'),
            html::tag('h3', array(), $this->gettext('sr_manager')) .
            html::tag('div', array('class'=>'sr-controls'),
                html::tag('a', array('href'=>'#','class'=>'button','data-cmd'=>'add'), $this->gettext('sr_add')) .
                html::tag('a', array('href'=>'#','class'=>'button','data-cmd'=>'shuffle_preview'), $this->gettext('sr_shuffle_preview')) .
                html::tag('a', array('href'=>'#','class'=>'button','data-cmd'=>'export'), $this->gettext('sr_export')) .
                html::tag('a', array('href'=>'#','class'=>'button mainaction','data-cmd'=>'import'), $this->gettext('sr_import'))
            ) .
            '<table id="sr-table" class="propform sr-table">
               <colgroup><col style="width:80px"/><col/><col style="width:100px"/><col style="width:420px"/></colgroup>
               <thead><tr>
                 <th class="title">'.$this->gettext('sr_include').'</th>
                 <th class="title">'.$this->gettext('sr_name').'</th>
                 <th class="title">'.$this->gettext('sr_weight').'</th>
                 <th class="title">'.$this->gettext('sr_actions').'</th>
               </tr></thead>
               <tbody><tr class="sr-empty"><td colspan="4">'.$this->gettext('sr_no_variants').'</td></tr></tbody>
             </table>'
        );

        $args['form']['signature_randomizer'] = array('name'=>$this->gettext('sr_title'),'content'=>$content);
        return $args;
    }

    /** Compose page integration */
    public function compose_render($args)
    {
        // Only run on compose pages
        if ($this->rc->task !== 'mail' || strpos((string)$this->rc->action, 'compose') !== 0) return $args;
        $enabled = !empty($this->rc->user->get_prefs()['sr_enabled']);
        $this->rc->output->set_env('sr_enabled', $enabled ? 1 : 0);
        $this->rc->output->set_env('request_token', $this->rc->get_request_token());

        $this->add_button(array(
            'command' => 'plugin.sr_shuffle',
            'type'    => 'link',
            'label'   => 'sr_toolbar_shuffle',
            'title'   => 'sr_toolbar_shuffle',
            'class'   => 'button sr-shuffle',
            'domain'  => $this->ID,
            'inner'   => html::img(array('src'=>$this->local_skin_path().'/shuffle.svg','alt'=>$this->gettext('sr_toolbar_shuffle')))
        ), 'toolbar');

        return $args;
    }

    /* ===== storage ===== */
    private function _get_all_variants()
    {
        $prefs = (array)$this->rc->user->get_prefs();
        return (isset($prefs[$this->prefs_key]) && is_array($prefs[$this->prefs_key])) ? $prefs[$this->prefs_key] : array();
    }
    private function _save_all_variants($all)
    {
        $prefs = (array)$this->rc->user->get_prefs();
        $prefs[$this->prefs_key] = $all;
        $this->rc->user->save_prefs($prefs);
    }
    private function _json($data){ header('Content-Type:application/json; charset=UTF-8'); echo json_encode($data); exit; }
    private function _log($msg){ if($this->rc->config->get('sr_debug',false)){ rcube::write_log('signature_randomizer',$msg); } }

    /* ===== AJAX ===== */
    public function action_get_variants()
    {
        $id   = rcube_utils::get_input_value('_id', rcube_utils::INPUT_GPC);
        $all  = $this->_get_all_variants();
        $list = (isset($all[$id]) && is_array($all[$id])) ? array_values($all[$id]) : array();
        $this->_log("get_variants id=$id count=".count($list));
        $this->_json(array('variants'=>$list));
    }

    public function action_save_variant()
    {
        $id      = rcube_utils::get_input_value('_id', rcube_utils::INPUT_POST);
        $variant = rcube_utils::get_input_value('_variant', rcube_utils::INPUT_POST, true);
        if (is_string($variant)) $variant = json_decode($variant, true);
        if (!is_array($variant)) { $this->_json(array('ok'=>false,'error'=>'bad_variant')); }

        $all = $this->_get_all_variants();
        if (!isset($all[$id]) || !is_array($all[$id])) $all[$id] = array();

        $found = false;
        foreach ($all[$id] as &$v) {
            if (isset($v['vid']) && $v['vid'] === $variant['vid']) {
                $v = $variant; $v['updated'] = date('c'); $found = true; break;
            }
        }
        if (!$found) {
            if (empty($variant['vid']))     $variant['vid']     = uniqid('v', true);
            if (!isset($variant['include'])) $variant['include'] = true;
            if (!isset($variant['weight']))  $variant['weight']  = 1;
            $variant['created'] = date('c'); $variant['updated'] = date('c');
            $all[$id][] = $variant;
        }
        $this->_save_all_variants($all);
        $this->_log("save_variant id=$id vid=".$variant['vid']);
        $this->_json(array('ok'=>true));
    }

    public function action_delete_variant()
    {
        $id  = rcube_utils::get_input_value('_id', rcube_utils::INPUT_POST);
        $vid = rcube_utils::get_input_value('_vid', rcube_utils::INPUT_POST);

        $all = $this->_get_all_variants();
        if (isset($all[$id]) && is_array($all[$id])) {
            $before = count($all[$id]);
            $filtered = array();
            foreach ($all[$id] as $v) if ($v['vid'] !== $vid) $filtered[] = $v;
            $all[$id] = array_values($filtered);
            $this->_save_all_variants($all);
            $this->_log("delete_variant id=$id vid=$vid before=$before after=".count($all[$id]));
        }
        $this->_json(array('ok'=>true));
    }

    public function action_duplicate_variant()
    {
        $id  = rcube_utils::get_input_value('_id', rcube_utils::INPUT_POST);
        $vid = rcube_utils::get_input_value('_vid', rcube_utils::INPUT_POST);
        $all = $this->_get_all_variants();
        if (isset($all[$id]) && is_array($all[$id])) {
            foreach ($all[$id] as $v) if ($v['vid'] === $vid) {
                $copy = $v;
                $copy['vid'] = uniqid('v', true);
                $copy['name'] = (isset($v['name']) && $v['name'] !== '' ? $v['name'] : 'Variant') . ' (copy)';
                $copy['created'] = date('c'); $copy['updated'] = date('c');
                $all[$id][] = $copy; $this->_save_all_variants($all);
                $this->_log("duplicate_variant id=$id src=$vid new=".$copy['vid']);
                break;
            }
        }
        $this->_json(array('ok'=>true));
    }

    public function action_reorder_variants()
    {
        $id    = rcube_utils::get_input_value('_id', rcube_utils::INPUT_POST);
        $order = rcube_utils::get_input_value('_order', rcube_utils::INPUT_POST, true);
        if (is_string($order)) $order = json_decode($order, true);

        $all = $this->_get_all_variants();
        if (isset($all[$id]) && is_array($all[$id]) && is_array($order)) {
            $map = array(); foreach ($all[$id] as $v) $map[$v['vid']] = $v;
            $new = array(); foreach ($order as $vid) if (isset($map[$vid])) $new[] = $map[$vid];
            $all[$id] = $new; $this->_save_all_variants($all);
            $this->_log("reorder_variants id=$id order_size=".count($order));
        }
        $this->_json(array('ok'=>true));
    }

    public function action_export()
    {
        $id   = rcube_utils::get_input_value('_id', rcube_utils::INPUT_GPC);
        $list = $this->_get_all_variants();
        $arr  = isset($list[$id]) ? $list[$id] : array();
        $this->_log("export id=$id count=".count($arr));
        $this->_json(array('variants'=>$arr));
    }

    public function action_import()
    {
        $id   = rcube_utils::get_input_value('_id', rcube_utils::INPUT_POST);
        $json = rcube_utils::get_input_value('_json', rcube_utils::INPUT_POST, true);
        $data = is_string($json) ? json_decode($json, true) : $json;
        if (!is_array($data)) { $this->_log("import invalid JSON"); $this->_json(array('ok'=>false,'error'=>'invalid_json')); }

        foreach ($data as &$v) {
            if (empty($v['vid']))     $v['vid']     = uniqid('v', true);
            if (!isset($v['include'])) $v['include'] = true;
            if (!isset($v['weight']))  $v['weight']  = 1;
            $v['updated'] = date('c'); if (empty($v['created'])) $v['created'] = date('c');
        }
        $all = $this->_get_all_variants();
        $all[$id] = array_values($data); $this->_save_all_variants($all);
        $this->_log("import id=$id count=".count($data));
        $this->_json(array('ok'=>true));
    }
}
